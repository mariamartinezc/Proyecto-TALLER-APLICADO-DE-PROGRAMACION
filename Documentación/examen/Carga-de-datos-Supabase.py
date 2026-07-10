import json
import re
import requests
import os
from dotenv import load_dotenv

# ============================================================================
# CONFIGURACIÓN Y CREDENCIALES
# ============================================================================
# Cargar credenciales ocultas (.env)
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Faltan credenciales. Asegúrate de tener el archivo .env configurado.")
    exit()

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

INSTITUCION_ID = 1
BUCKET_NAME = "mallas-curriculares"

# ============================================================================
# FUNCIONES UTILITARIAS
# ============================================================================
def encontrar_archivo(nombre_archivo: str):
    """Busca un archivo en múltiples ubicaciones posibles"""
    rutas_posibles = [
        nombre_archivo,
        os.path.join("src", nombre_archivo),
        os.path.join(os.getcwd(), nombre_archivo),
        os.path.join(os.getcwd(), "src", nombre_archivo),
        os.path.join('..', 'scraping', nombre_archivo)
    ]
    for ruta in rutas_posibles:
        if os.path.exists(ruta):
            return ruta
    return None

def extraer_numero(texto):
    """Extrae números de textos como '8 Semestres'"""
    if not texto: return 0
    numeros = re.findall(r'\d+', str(texto))
    return int(numeros[0]) if numeros else 0

def limpiar_monto(monto_str):
    """Limpia textos numéricos o montos enteros"""
    if not monto_str: return 0
    num_str = str(monto_str).replace('.', '').strip()
    return int(num_str) if num_str.isdigit() else 0

def subir_pdf_a_storage(nombre_archivo):
    """Busca el PDF en la ruta local y lo sube a Supabase Storage"""
    ruta_local = os.path.join('../frontend/public/mallas', nombre_archivo)
    
    if not os.path.exists(ruta_local):
        print(f"Advertencia: No se encontró el PDF local en {ruta_local}")
        return None

    url_upload = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{nombre_archivo}"
    
    headers_storage = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/pdf"
    }

    try:
        with open(ruta_local, "rb") as pdf_file:
            response = requests.post(url_upload, headers=headers_storage, data=pdf_file)
            url_publica = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{nombre_archivo}"
            
            if response.status_code == 200:
                print(f"PDF subido exitosamente al Storage.")
                return url_publica
            elif response.status_code == 400:
                print(f"El PDF ya existe en Storage. Vinculando URL existente...")
                return url_publica
            else:
                print(f"Error inesperado en Storage (Status {response.status_code}): {response.text}")
                return None       
    except Exception as e:
        print(f"Error inesperado subiendo el PDF: {e}")
        return None

# ============================================================================
# PROCESO PRINCIPAL DE MIGRACIÓN
# ============================================================================
def subir_datos():
    print("Iniciando migración a Supabase (Datos Cruzados + PDFs)...")
    
    # Buscamos el archivo correcto generado por el traductor/mezclador
    ruta_json = encontrar_archivo("datos_con_empleabilidad.json")
    
    if not ruta_json:
        print("Error: No se encontró el archivo 'datos_con_empleabilidad.json'.")
        print("Asegúrate de ejecutar primero el script que cruza los datos de Duoc con MiFuturo.")
        return

    print(f"Leyendo datos desde: {ruta_json}")
    with open(ruta_json, "r", encoding="utf-8") as f:
        crawled_data = json.load(f)

    # Verificar conexión inicial a la API Rest de Supabase
    prueba_conexion = requests.get(f"{SUPABASE_URL}/rest/v1/carreras?limit=1", headers=HEADERS)
    if prueba_conexion.status_code not in [200, 201]:
        print("Error: No se pudo conectar a Supabase. Revisa las credenciales de tu .env")
        return
        
    for carrera in crawled_data:
        nombre_carrera = carrera.get("nombre_carrera")
        print(f"\nProcesando: {nombre_carrera}")
        
        # --- 1. SUBIDA DEL PDF DE LA MALLA ---
        malla_pdf_field = carrera.get("malla_pdf")
        malla_url_cloud = None
        
        if malla_pdf_field:
            nombre_archivo_pdf = malla_pdf_field.split('/')[-1]
            malla_url_cloud = subir_pdf_a_storage(nombre_archivo_pdf)
        else:
            print("   Esta carrera no posee un archivo PDF de malla registrado.")

        # --- 2. EXTRACCIÓN SEGURA DE EMPLEABILIDAD Y FINANZAS ---
        emp = carrera.get("empleabilidad") or {}
        
        arancel_ref = limpiar_monto(carrera["sedes"][0].get("arancel")) if carrera.get("sedes") else 0
        matricula_ref = limpiar_monto(carrera["sedes"][0].get("matricula")) if carrera.get("sedes") else 0

        # Mapeo estructurado para las columnas exactas de tu tabla en Supabase
        datos_carrera = {
            "institucion_id": INSTITUCION_ID,
            "nombre": nombre_carrera,
            "url_duoc": carrera.get("url_fuente"),
            "descripcion": carrera.get("descripcion", ""),
            "campo_laboral": carrera.get("campo_laboral", ""),
            "area_conocimiento": "Por clasificar",
            "duracion_semestre": extraer_numero(carrera.get("duracion")),
            "jornada": "Diurna/Vespertina",
            "modalidad": "Presencial",
            "arancel_anual": arancel_ref,
            "matricula_referencial": matricula_ref,
            
            # Datos de empleabilidad rescatados de manera segura (evita errores si son None)
            "empleabilidad_1er_anio": emp.get("empleabilidad_primer_ano") if emp.get("empleabilidad_primer_ano") is not None else None,
            "empleabilidad_2do_anio": emp.get("empleabilidad_segundo_ano") if emp.get("empleabilidad_segundo_ano") is not None else None,
            "ingreso_promedio_4to_anio": limpiar_monto(emp.get("ingreso_promedio_cuarto_ano")) if emp.get("ingreso_promedio_cuarto_ano") else 0,
            
            "acreditacion": "SI",
            "malla_pdf_url": malla_url_cloud
        }

        # --- 3. ENVIAR CARRERA A SUPABASE ---
        res_carrera = requests.post(f"{SUPABASE_URL}/rest/v1/carreras", json=datos_carrera, headers=HEADERS)
        
        if res_carrera.status_code not in [200, 201]:
            print(f"Error guardando carrera en la tabla: {res_carrera.text}")
            continue
            
        carrera_id = res_carrera.json()[0]['id']
        print(f"Carrera guardada en Base de Datos (ID: {carrera_id})")

        # --- 4. PROCESAR SEDES DE ESTA CARRERA ---
        for sede_data in carrera.get("sedes", []):
            nombre_sede = sede_data.get("sede")
            lat = sede_data.get("latitud")
            lng = sede_data.get("longitud")
            
            query_params = {"nombre": f"eq.{nombre_sede}", "select": "id"}
            res_buscar = requests.get(f"{SUPABASE_URL}/rest/v1/sedes", headers=HEADERS, params=query_params)
            
            sede_id = None
            if res_buscar.status_code == 200 and len(res_buscar.json()) > 0:
                sede_id = res_buscar.json()[0]['id']
            else:
                nueva_sede = {
                    "institucion_id": INSTITUCION_ID,
                    "nombre": nombre_sede,
                    "region": "RM" if "VIÑA" not in nombre_sede.upper() and "CONCEPCIÓN" not in nombre_sede.upper() and "PUERTO MONTT" not in nombre_sede.upper() else "Regiones",
                    "comuna": "Por definir",
                    "direccion": "Sede Duoc UC",
                    "latitud": lat,
                    "longitud": lng
                }
                res_nueva_sede = requests.post(f"{SUPABASE_URL}/rest/v1/sedes", json=nueva_sede, headers=HEADERS)
                if res_nueva_sede.status_code in [200, 201]:
                    sede_id = res_nueva_sede.json()[0]['id']

            # --- 5. ASOCIAR CARRERA CON SU SEDE (Muchos a Muchos) ---
            if sede_id:
                vinculo = {
                    "carrera_id": carrera_id,
                    "sede_id": sede_id,
                    "cupos": 0
                }
                headers_upsert = HEADERS.copy()
                headers_upsert["Prefer"] = "resolution=ignore-duplicates"
                
                requests.post(f"{SUPABASE_URL}/rest/v1/carreras_sedes", json=vinculo, headers=headers_upsert)
                print(f"      Connected to Sede: {nombre_sede}")

    print("\n¡MIGRACIÓN COMPLETADA EXITOSAMENTE! Revisa tus datos en Supabase.")

if __name__ == "__main__":
    subir_datos()