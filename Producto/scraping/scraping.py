import os
import time
import json
import re
import requests
import urllib.parse
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import unicodedata

# --- CACHÉ GLOBAL DE COORDENADAS ---
CACHE_COORDENADAS = {}

# --- DICCIONARIO DE REGIONES ---
MAPEO_REGIONES = {
    "MAIPÚ": "Región Metropolitana",
    "PLAZA OESTE": "Región Metropolitana",
    "SAN JOAQUÍN": "Región Metropolitana",
    "PUENTE ALTO": "Región Metropolitana",
    "ALONSO DE OVALLE": "Región Metropolitana",
    "PADRE ALONSO DE OVALLE": "Región Metropolitana",
    "PLAZA NORTE": "Región Metropolitana",
    "MELIPILLA": "Región Metropolitana",
    "SANTIAGO CENTRO": "Región Metropolitana",
    "SAN BERNARDO": "Región Metropolitana",
    "ALAMEDA": "Región Metropolitana",
    "PLAZA VESPUCIO": "Región Metropolitana",
    "SAN CARLOS DE APOQUINDO": "Región Metropolitana",
    "ANTONIO VARAS": "Región Metropolitana",
    "VIÑA DEL MAR": "Región de Valparaíso",
    "CONCEPCIÓN": "Región del Biobío",
    "CAMPUS NACIMIENTO": "Región del Biobío",
    "SAN ANDRÉS DE CONCEPCIÓN": "Región del Biobío",
    "PUERTO MONTT": "Región de Los Lagos",
    "ONLINE": "Modalidad Virtual"
}

# --- PARTE 1: COMPROBACIÓN ÉTICA ---
def verificar_permiso_etico(navegador, url_base):
    print(f"Verificando ética en {url_base}...")
    try:
        navegador.get(url_base + "/robots.txt")
        time.sleep(2)
        contenido = navegador.find_element(By.TAG_NAME, "body").text.lower()
        if "disallow: /carreras/" in contenido:
            print("Acceso restringido por robots.txt")
            return False
        return True
    except:
        return True

# --- PARTE 2: UTILITARIOS ---
def limpiar_monto_dinero(texto):
    if not texto: return "0"
    return re.sub(r'\D', '', texto)

def limpiar_nombre_archivo(nombre):
    nombre = nombre.replace(" ", "_").lower()
    nombre_normalizado = unicodedata.normalize('NFKD', nombre)
    nombre_limpio = "".join([c for c in nombre_normalizado if not unicodedata.combining(c)])
    nombre_limpio = re.sub(r'[^a-z0-9_\.]', '', nombre_limpio)
    return nombre_limpio

def descargar_malla_pdf(enlace_pdf, nombre_carrera):
    try:
        carpeta = os.path.join('../frontend/public/mallas')
        if not os.path.exists(carpeta): os.makedirs(carpeta)
        
        nombre_seguro = limpiar_nombre_archivo(nombre_carrera)
        nombre_archivo = f"malla_{nombre_seguro}.pdf"
        ruta_final = os.path.join(carpeta, nombre_archivo)
        
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        res = requests.get(enlace_pdf, stream=True, timeout=15, headers=headers)
        if res.status_code == 200:
            with open(ruta_final, 'wb') as f:
                for chunk in res.iter_content(chunk_size=1024):
                    if chunk: f.write(chunk)
            return f"/mallas/{nombre_archivo}"
        return None
    except Exception as e:
        print(f"Error descargando PDF: {e}")
        return None

def buscar_coordenadas_osm(nombre_sede):
    sede_clean = nombre_sede.strip().upper()
    if sede_clean in CACHE_COORDENADAS:
        return CACHE_COORDENADAS[sede_clean]
    if "ONLINE" in sede_clean or "VIRTUAL" in sede_clean:
        return {"latitud": None, "longitud": None}

    print(f"Buscando coordenadas (API) para Sede {nombre_sede}...")
    try:
        direccion = f"Duoc UC Sede {nombre_sede}, Chile"
        url_api = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(direccion)}&format=json&limit=1"
        headers = {"User-Agent": "DuocScraperBot/1.0 (mi-email-de-estudiante@duocuc.cl)"}
        respuesta = requests.get(url_api, headers=headers, timeout=10)
        
        coordenadas = {"latitud": None, "longitud": None}
        if respuesta.status_code == 200 and len(respuesta.json()) > 0:
            data = respuesta.json()[0]
            coordenadas["latitud"] = float(data["lat"])
            coordenadas["longitud"] = float(data["lon"])
            print(f"Encontrado API -> Lat: {coordenadas['latitud']}, Lon: {coordenadas['longitud']}")
        else:
            direccion_fallback = f"Duoc UC {nombre_sede}, Chile"
            url_api_fb = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(direccion_fallback)}&format=json&limit=1"
            respuesta_fb = requests.get(url_api_fb, headers=headers, timeout=10)
            if respuesta_fb.status_code == 200 and len(respuesta_fb.json()) > 0:
                data = respuesta_fb.json()[0]
                coordenadas["latitud"] = float(data["lat"])
                coordenadas["longitud"] = float(data["lon"])
                print(f"Encontrado API (Respaldo) -> Lat: {coordenadas['latitud']}, Lon: {coordenadas['longitud']}")
        
        CACHE_COORDENADAS[sede_clean] = coordenadas
        time.sleep(1)
        return coordenadas
    except Exception as e:
        print(f"Error en API de Coordenadas: {e}")
        return {"latitud": None, "longitud": None}

# --- PARTE 3: EXTRACCIÓN DETALLADA ---
def extraer_datos_carrera(navegador, url_especifica, url_base):
    print(f"\nProcesando: {url_especifica}")
    try:
        navegador.get(url_especifica)
        
        wait = WebDriverWait(navegador, 12)
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "h1")))
        
        # Despertar elementos dinámicos mediante scroll controlado
        navegador.execute_script("window.scrollTo(0, 400);")
        time.sleep(1)
        navegador.execute_script("window.scrollTo(0, 1000);")
        time.sleep(1)
        
        pestanas_objetivo = [
            "PERFIL DE EGRESO INSTITUCIONAL",
            "DETALLES DE CARRERA",
            "MALLA DE LA CARRERA",
            "SEDES Y ARANCELES"
        ]
        
        for nombre_pestana in pestanas_objetivo:
            try:
                xpath_pestana = f"//a[contains(translate(text(), 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), '{nombre_pestana}')] | //button[contains(translate(text(), 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), '{nombre_pestana}')]"
                elementos = navegador.find_elements(By.XPATH, xpath_pestana)
                if elementos:
                    navegador.execute_script("arguments[0].click();", elementos[0])
                    time.sleep(1.2)
                    navegador.execute_script("window.scrollBy(0, 400);")
                    time.sleep(0.5)
            except:
                pass

        navegador.execute_script("window.scrollTo(0, 0);")
        time.sleep(1)
        
        soup = BeautifulSoup(navegador.page_source, 'html.parser')
        titulo = soup.find('h1').text.strip() if soup.find('h1') else "Carrera sin título"
        
        # Calcular Duración de la carrera
        duracion = "No especificada"
        texto_completo = soup.get_text(" ", strip=True)
        match_dur = re.search(r'(\d+)\s+(semestres|bimestres|trimestres)', texto_completo, re.IGNORECASE)
        if match_dur:
            duracion = f"{match_dur.group(1)} {match_dur.group(2).capitalize()}"
        else:
            duracion = "8 Semestres" if "ingeniería" in titulo.lower() else "5 Semestres"

        # --- EXTRACCIÓN MEDIANTE ESTRUCTURA REAL DE BLOQUES DE TEXTO ---
        desc_list = []
        campo_list = []
        
        # Analizamos todos los encabezados y etiquetas relevantes de la vista
        for item in soup.find_all(['h3', 'b', 'div']):
            txt = item.get_text(strip=True)
            
            # 1. Capturar Bloques de la Descripción del Perfil de Egreso
            if txt == "Descripción del Perfil de Egreso":
                parent_page = item.find_parent('div', class_='page') or item
                siguiente_page = parent_page.find_next_sibling('div', class_='page')
                if siguiente_page:
                    columnas = siguiente_page.find_all('div', class_='column')
                    for col in columnas:
                        t_col = col.get_text(" ", strip=True)
                        if t_col and t_col not in desc_list:
                            desc_list.append(t_col)

            # 2. Capturar Bloques de la Descripción del Campo Ocupacional
            if txt == "Descripción del Campo Ocupacional" or txt == "Descripción del Campo Laboral":
                parent_page = item.find_parent('div', class_='page') or item
                siguiente_page = parent_page.find_next_sibling('div', class_='page')
                if siguiente_page:
                    columnas = siguiente_page.find_all('div', class_='column')
                    for col in columnas:
                        t_col = col.get_text(" ", strip=True)
                        if t_col and t_col not in campo_list:
                            campo_list.append(t_col)

        # Unimos las listas de texto mapeadas usando saltos de línea dobles
        desc = "\n\n".join(desc_list) if desc_list else None
        campo = "\n\n".join(campo_list) if campo_list else None

        # --- SISTEMA DE CONTINGENCIA (FALLBACK) EN CASO DE AUSENCIA ---
        if not desc or len(desc.strip()) < 25:
            desc = f"La descripción detallada del Perfil de Egreso de esta carrera se encuentra disponible directamente en el portal oficial de Duoc UC. Puedes revisarla haciendo clic en el siguiente enlace oficial: {url_especifica}"
            
        if not campo or len(campo.strip()) < 25:
            campo = f"El detalle completo del Campo Ocupacional y las áreas de desempeño laboral están publicados directamente en la ficha oficial de la institución. Visita el sitio web informativo aquí: {url_especifica}"

        # --- EXTRAER PDF ---
        pdf_path = None
        for link in soup.find_all('a', href=True):
            href = link['href']
            if href.lower().endswith('.pdf') or ('malla' in href.lower() and '.pdf' in href.lower()):
                if not href.startswith('http'):
                    href = url_base.rstrip('/') + '/' + href.lstrip('/')
                pdf_path = descargar_malla_pdf(href, titulo)
                if pdf_path:
                    break

        # --- SEDES, REGIONES Y ARANCELES ---
        sedes_validas = ["MAIPÚ", "PLAZA OESTE", "SAN JOAQUÍN", "VIÑA DEL MAR", "PUENTE ALTO", 
                         "ALONSO DE OVALLE", "PLAZA NORTE", "MELIPILLA", "SANTIAGO CENTRO", 
                         "SAN BERNARDO", "CONCEPCIÓN", "ONLINE", "ANTONIO VARAS", "PADRE ALONSO DE OVALLE",
                         "PLAZA VESPUCIO", "ALAMEDA", "PUERTO MONTT","CAMPUS NACIMIENTO",
                         "SAN CARLOS DE APOQUINDO", "SAN ANDRÉS DE CONCEPCIÓN"]
        info_sedes = []

        for contenedor in soup.find_all(['tr', 'div', 'li', 'p']):
            txt_c = contenedor.get_text(" ", strip=True).upper()
            sede_encontrada = next((s for s in sedes_validas if s in txt_c), None)
            
            if sede_encontrada:
                precios = re.findall(r'\$\s?[\d\.]+', txt_c)
                if precios and not any(item['sede'] == sede_encontrada for item in info_sedes):
                    geo = buscar_coordenadas_osm(sede_encontrada)
                    region_assigned = MAPEO_REGIONES.get(sede_encontrada, "Sin Región")
                    
                    info_sedes.append({
                        "sede": sede_encontrada,
                        "region": region_assigned,
                        "matricula": limpiar_monto_dinero(precios[0]),
                        "arancel": limpiar_monto_dinero(precios[-1]),
                        "latitud": geo["latitud"],
                        "longitud": geo["longitud"]
                    })

        if not info_sedes and ("ONLINE" in texto_completo.upper() or "VIRTUAL" in texto_completo.upper()):
            precios_web = re.findall(r'\$\s?[\d\.]+', texto_completo)
            if precios_web:
                info_sedes.append({
                    "sede": "MODALIDAD ONLINE",
                    "region": MAPEO_REGIONES["ONLINE"],
                    "matricula": limpiar_monto_dinero(precios_web[0]),
                    "arancel": limpiar_monto_dinero(precios_web[-1]),
                    "latitud": None,
                    "longitud": None
                })

        return {
            "nombre_carrera": titulo,
            "duracion": duracion,
            "url_fuente": url_especifica,
            "descripcion": desc,
            "campo_laboral": campo,
            "malla_pdf": pdf_path,
            "sedes": info_sedes
        }
    except Exception as e:
        print(f"Error procesando carrera {url_especifica}: {e}")
        return None

# --- PARTE 4: EJECUCIÓN TOTAL ---
def iniciar_extraccion_total():
    institucion = {
        "nombre": "Duoc UC",
        "web": "https://www.duoc.cl",
        "urls": [
            "https://www.duoc.cl/carreras/administracion-de-empresas",
            "https://www.duoc.cl/carreras/administracion-en-turismo-y-hospitalidad-mencion-administracion-hotelera-2",
            "https://www.duoc.cl/carreras/administracion-en-turismo-y-hospitalidad-mencion-ecoturismo",
            "https://www.duoc.cl/carreras/administracion-en-turismo-y-hospitalidad-mencion-gestion-de-destinos-turisticos",
            "https://www.duoc.cl/carreras/administracion-en-turismo-y-hospitalidad-mencion-hospitality-management-2",
            "https://www.duoc.cl/carreras/administracion-publica-2",
            "https://www.duoc.cl/carreras/analista-programador-2",
            "https://www.duoc.cl/carreras/analista-programador-computacional",
            "https://www.duoc.cl/carreras/animacion-digital-2",
            "https://www.duoc.cl/carreras/audit-nuevatest",
            "https://www.duoc.cl/carreras/auditoria-2",
            "https://www.duoc.cl/carreras/auditoria-y-analisis-de-negocios",
            "https://www.duoc.cl/carreras/comercio-exterior-2",
            "https://www.duoc.cl/carreras/comunicacion-audiovisual-2",
            "https://www.duoc.cl/carreras/contabilidad-general-mencion-legislacion-tributaria",
            "https://www.duoc.cl/carreras/contabilidad-tributaria-5",
            "https://www.duoc.cl/carreras/desarrollo-de-aplicaciones-5",
            "https://www.duoc.cl/carreras/desarrollo-y-diseno-web",
            "https://www.duoc.cl/carreras/dibujo-y-modelamiento-arquitectonico-y-estructural",
            "https://www.duoc.cl/carreras/diseno-de-ambientes",
            "https://www.duoc.cl/carreras/diseno-de-vestuario-2",
            "https://www.duoc.cl/carreras/diseno-grafico-3",
            "https://www.duoc.cl/carreras/diseno-industrial-3",
            "https://www.duoc.cl/carreras/gastronomia-2",
            "https://www.duoc.cl/carreras/gastronomia-internacional-2",
            "https://www.duoc.cl/carreras/ilustracion-para-contextos-globales",
            "https://www.duoc.cl/carreras/informatica-biomedica-2",
            "https://www.duoc.cl/carreras/ingenieria-agricola-4",
            "https://www.duoc.cl/carreras/ingenieria-en-administracion-mencion-finanzas-2",
            "https://www.duoc.cl/carreras/ingenieria-en-administracion-mencion-gestion-de-personas-2",
            "https://www.duoc.cl/carreras/ingenieria-en-administracion-mencion-innovacion-y-emprendimiento-3",
            "https://www.duoc.cl/carreras/ingenieria-en-automatizacion-y-control-industrial",
            "https://www.duoc.cl/carreras/ingenieria-en-ciberseguridad",
            "https://www.duoc.cl/carreras/ingenieria-en-ciencia-de-datos",
            "https://www.duoc.cl/carreras/ingenieria-en-comercio-exterior",
            "https://www.duoc.cl/carreras/ingenieria-en-construccion-2",
            "https://www.duoc.cl/carreras/ingenieria-en-desarrollo-de-software-2",
            "https://www.duoc.cl/carreras/ingenieria-en-electricidad-y-automatizacion-industrial",
            "https://www.duoc.cl/carreras/ingenieria-en-gestion-de-personas",
            "https://www.duoc.cl/carreras/ingenieria-en-gestion-logistica-2",
            "https://www.duoc.cl/carreras/ingenieria-en-informatica",
            "https://www.duoc.cl/carreras/ingenieria-en-infraestructura-tecnologica",
            "https://www.duoc.cl/carreras/ingenieria-en-mantenimiento-industrial-2",
            "https://www.duoc.cl/carreras/ingenieria-en-maquinaria-y-vehiculos-pesados",
            "https://www.duoc.cl/carreras/ingenieria-en-marketing-digital-2",
            "https://www.duoc.cl/carreras/ingenieria-en-mecanica-automotriz-y-autotronica",
            "https://www.duoc.cl/carreras/ingenieria-en-medio-ambiente-3",
            "https://www.duoc.cl/carreras/ingenieria-en-prevencion-de-riesgos",
            "https://www.duoc.cl/carreras/ingenieria-en-redes-y-telecomunicaciones",
            "https://www.duoc.cl/carreras/ingenieria-en-sonido",
            "https://www.duoc.cl/carreras/ingenieria-industrial",
            "https://www.duoc.cl/carreras/preparador-fisico-2",
            "https://www.duoc.cl/carreras/publicidad-2",
            "https://www.duoc.cl/carreras/relaciones-publicas-y-comunicacion-organizacional",
            "https://www.duoc.cl/carreras/restauracion-de-bienes-patrimoniales",
            "https://www.duoc.cl/carreras/tecnico-agricola-4",
            "https://www.duoc.cl/carreras/tecnico-audiovisual-2",
            "https://www.duoc.cl/carreras/tecnico-de-laboratorio-clinico-y-banco-de-sangre",
            "https://www.duoc.cl/carreras/tecnico-de-radiodiagnostico-y-radioterapia",
            "https://www.duoc.cl/carreras/tecnico-en-administracion",
            "https://www.duoc.cl/carreras/tecnico-en-calidad-de-alimentos-3",
            "https://www.duoc.cl/carreras/tecnico-en-construccion-2",
            "https://www.duoc.cl/carreras/tecnico-en-control-y-monitoreo-remoto-de-procesos-mineros",
            "https://www.duoc.cl/carreras/tecnico-en-electricidad-y-automatizacion-industrial",
            "https://www.duoc.cl/carreras/tecnico-en-electricidad-y-energias-renovables",
            "https://www.duoc.cl/carreras/tecnico-en-enfermeria-2",
            "https://www.duoc.cl/carreras/tecnico-en-geologia-3",
            "https://www.duoc.cl/carreras/tecnico-en-gestion-logistica",
            "https://www.duoc.cl/carreras/tecnico-en-mantenimiento-industrial",
            "https://www.duoc.cl/carreras/tecnico-en-maquinaria-y-vehiculos-pesados",
            "https://www.duoc.cl/carreras/tecnico-en-mecanica-automotriz-y-autotronica-2",
            "https://www.duoc.cl/carreras/tecnico-en-odontologia-2",
            "https://www.duoc.cl/carreras/tecnico-en-operacion-y-supervision-de-procesos-mineros-2",
            "https://www.duoc.cl/carreras/tecnico-en-operaciones-logisticas",
            "https://www.duoc.cl/carreras/tecnico-en-prevencion-de-riesgos",
            "https://www.duoc.cl/carreras/tecnico-en-prevencion-de-riesgos-laborales-2",
            "https://www.duoc.cl/carreras/tecnico-en-quimica-y-farmacia",
            "https://www.duoc.cl/carreras/tecnico-en-redes-y-telecomunicaciones",
            "https://www.duoc.cl/carreras/tecnico-en-trabajo-social",
            "https://www.duoc.cl/carreras/tecnico-en-turismo-y-hospitalidad-2",
            "https://www.duoc.cl/carreras/tecnico-topografo-geomatico",
            "https://www.duoc.cl/carreras/tecnico-veterinario-y-pecuario",
            "https://www.duoc.cl/carreras/tecnologia-en-sonido-e-iluminacion",
        ]
    }
    
    opciones = Options()
    opciones.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0")
    
    try:
        navegador = webdriver.Edge(options=opciones)
        resultados = []

        if verificar_permiso_etico(navegador, institucion['web']):
            for url in institucion['urls']:
                datos = extraer_datos_carrera(navegador, url, institucion['web'])
                if datos:
                    datos['institucion'] = institucion['nombre']
                    resultados.append(datos)
                time.sleep(2)

        ruta_json = os.path.join('..', 'scraping', 'datos.json')
        os.makedirs(os.path.dirname(ruta_json), exist_ok=True)
        with open(ruta_json, 'w', encoding='utf-8') as f:
            json.dump(resultados, f, ensure_ascii=False, indent=4)
        
        print(f"\nPROCESO COMPLETADO EXITOSAMENTE: Se guardaron {len(resultados)} carreras con los datos unificados en datos.json.")

    finally:
        if 'navegador' in locals(): navegador.quit()

if __name__ == "__main__":
    iniciar_extraccion_total()