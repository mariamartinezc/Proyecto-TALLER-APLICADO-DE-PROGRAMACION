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
from webdriver_manager.microsoft import EdgeChromiumDriverManager
import unicodedata


# --- CACHÉ GLOBAL DE COORDENADAS ---
# Evita buscar la misma sede en Google Maps decenas de veces, acelerando el proceso.
CACHE_COORDENADAS = {}

# --- PARTE 1: COMPROBACIÓN ÉTICA ---
def verificar_permiso_etico(navegador, url_base):
    print(f"Verificando ética en {url_base}...")
    try:
        navegador.get(url_base + "/robots.txt")
        time.sleep(2)
        contenido = navegador.find_element("tag name", "body").text.lower()
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
    """
    Quita tildes, eñes y caracteres especiales para cumplir 
    con las reglas estrictas de Supabase Storage desde el origen.
    """
    # Cambia espacios por guiones bajos y pasa a minúsculas
    nombre = nombre.replace(" ", "_").lower()
    
    # Normaliza el texto para separar las letras de sus tildes
    nombre_normalizado = unicodedata.normalize('NFKD', nombre)
    
    # Filtra y se queda solo con caracteres ASCII (letras simples, números y guiones)
    nombre_limpio = "".join([c for c in nombre_normalizado if not unicodedata.combining(c)])
    
    # Por seguridad extra, elimina cualquier cosa que no sea letra, número, guion o punto
    nombre_limpio = re.sub(r'[^a-z0-9_\.]', '', nombre_limpio)
    
    return nombre_limpio

def descargar_malla_pdf(enlace_pdf, nombre_carrera):
    try:
        carpeta = os.path.join('../frontend/public/mallas')
        if not os.path.exists(carpeta): os.makedirs(carpeta)
        
        # 1. Pasamos el nombre de la carrera por el limpiador de tildes y caracteres
        nombre_seguro = limpiar_nombre_archivo(nombre_carrera)
        
        # 2. Ahora el nombre del archivo final está 100% estandarizado para Supabase
        nombre_archivo = f"malla_{nombre_seguro}.pdf"
        ruta_final = os.path.join(carpeta, nombre_archivo)
        
        res = requests.get(enlace_pdf, stream=True, timeout=15)
        if res.status_code == 200:
            with open(ruta_final, 'wb') as f:
                for chunk in res.iter_content(chunk_size=1024):
                    if chunk: f.write(chunk)
            
            # Retorna la ruta limpia que se escribirá en el JSON
            return f"/mallas/{nombre_archivo}"
        return None
    except Exception as e:
        print(f"Error PDF: {e}")
        return None

def buscar_coordenadas_maps(navegador, nombre_sede):
    """
    Función Inyectada: Abre una pestaña temporal, busca la sede en Google Maps,
    extrae las coordenadas de la URL dinámica de Google y las guarda en caché.
    """
    sede_clean = nombre_sede.strip().upper()
    
    if sede_clean in CACHE_COORDENADAS:
        return CACHE_COORDENADAS[sede_clean]
    
    if "ONLINE" in sede_clean or "VIRTUAL" in sede_clean:
        return {"latitud": None, "longitud": None}

    print(f"Buscando coordenadas en Google Maps para: Sede {nombre_sede}...")
    try:
        ventana_duoc = navegador.current_window_handle
        
        # Abrir pestaña secundaria en Edge
        navegador.execute_script("window.open('');")
        navegador.switch_to.window(navegador.window_handles[-1])
        
        termino_busqueda = f"Duoc UC Sede {nombre_sede}, Chile"
        url_maps = f"https://www.google.com/maps/search/{urllib.parse.quote(termino_busqueda)}"
        navegador.get(url_maps)
        
        # Espera para que cargue la redirección geolocalizada de Google Maps (@lat,lon)
        time.sleep(5)
        
        url_actual = navegador.current_url
        match = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', url_actual)
        
        coordenadas = {"latitud": None, "longitud": None}
        if match:
            coordenadas["latitud"] = float(match.group(1))
            coordenadas["longitud"] = float(match.group(2))
            print(f"Encontrado -> Lat: {coordenadas['latitud']}, Lon: {coordenadas['longitud']}")
        else:
            time.sleep(3)
            url_actual = navegador.current_url
            match = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', url_actual)
            if match:
                coordenadas["latitud"] = float(match.group(1))
                coordenadas["longitud"] = float(match.group(2))
                print(f"Encontrado (reintento) -> Lat: {coordenadas['latitud']}, Lon: {coordenadas['longitud']}")
            else:
                print(f"No se capturaron coordenadas en la URL para: {nombre_sede}")
        
        CACHE_COORDENADAS[sede_clean] = coordenadas
        
        navegador.close()
        navegador.switch_to.window(ventana_duoc)
        return coordenadas

    except Exception as e:
        print(f"Error al conectar con Google Maps para {nombre_sede}: {e}")
        if len(navegador.window_handles) > 1:
            navegador.close()
        navegador.switch_to.window(navegador.window_handles[0])
        return {"latitud": None, "longitud": None}

# --- PARTE 3: EXTRACCIÓN DETALLADA ---
def extraer_datos_carrera(navegador, url_especifica, url_base):
    print(f"\nProcesando: {url_especifica}")
    try:
        navegador.get(url_especifica)
        
        # Tu scroll dinámico original intacto
        navegador.execute_script("window.scrollTo(0, 800);")
        time.sleep(5)
        navegador.execute_script("window.scrollTo(0, 1400);")
        time.sleep(5) 
        
        soup = BeautifulSoup(navegador.page_source, 'html.parser')
        
        # 1. Datos Básicos
        titulo = soup.find('h1').text.strip() if soup.find('h1') else "Carrera sin título"
        texto_full = soup.get_text(" ", strip=True)
        
        # 2. Duración Flexible
        duracion = "No especificada"
        match_dur = re.search(r'(\d+)\s+(semestres|bimestres|trimestres)', texto_full, re.IGNORECASE)
        if match_dur:
            duracion = f"{match_dur.group(1)} {match_dur.group(2).capitalize()}"

        # 3. Descripción y Campo Laboral 
        desc = "Descripción no disponible."
        campo = "Campo laboral no disponible."
        for bloque in soup.find_all(['p', 'div', 'span']):
            txt = bloque.get_text().upper()
            if "PERFIL DE EGRESO" in txt or "LA CARRERA" in txt:
                desc = bloque.get_text(strip=True)
            if "CAMPO LABORAL" in txt or "OCUPACIONAL" in txt:
                campo = bloque.get_text(strip=True)

        # 4. Sedes y Aranceles
        sedes_validas = ["MAIPÚ", "PLAZA OESTE", "SAN JOAQUÍN", "VIÑA DEL MAR", "PUENTE ALTO", 
                        "ALONSO DE OVALLE", "PLAZA NORTE", "MELIPILLA", "SANTIAGO CENTRO", 
                        "SAN BERNARDO", "CONCEPCIÓN", "ONLINE", "ANTONIO VARAS", "PADRE ALONSO DE OVALLE",
                        "PLAZA VESPUCIO", "ALAMEDA", "PUERTO MONTT","CAMPUS NACIMIENTO",
                        "SAN CARLOS DE APOQUINDO", "SAN ANDRÉS DE CONCEPCIÓN"]
        info_sedes = [] 
        
        # CASO A: Modalidad Online
        if "ONLINE" in texto_full.upper() or "VIRTUAL" in texto_full.upper():
            precios_web = re.findall(r'\$\s?[\d\.]+', texto_full)
            if precios_web:
                info_sedes.append({
                    "sede": "MODALIDAD ONLINE",
                    "matricula": limpiar_monto_dinero(precios_web[0]),
                    "arancel": limpiar_monto_dinero(precios_web[-1]),
                    "latitud": None,
                    "longitud": None
                })

        # CASO B: Sedes físicas 
        for contenedor in soup.find_all(['tr', 'div', 'li']):
            txt_c = contenedor.get_text(" ", strip=True).upper()
            sede_encontrada = next((s for s in sedes_validas if s in txt_c), None)
            
            if sede_encontrada:
                precios = re.findall(r'\$\s?[\d\.]+', txt_c)
                if precios:
                    if not any(item['sede'] == sede_encontrada for item in info_sedes):
                        # -> Aquí llamamos a Google Maps usando el navegador activo
                        geo = buscar_coordenadas_maps(navegador, sede_encontrada)
                        
                        info_sedes.append({
                            "sede": sede_encontrada,
                            "matricula": limpiar_monto_dinero(precios[0]),
                            "arancel": limpiar_monto_dinero(precios[-1]),
                            "latitud": geo["latitud"],
                            "longitud": geo["longitud"]
                        })

        # 5. Malla PDF original intacta
        pdf_tag = soup.find('a', href=re.compile(r'.*\.pdf'))
        pdf_path = None
        if pdf_tag:
            link = pdf_tag['href']
            if not link.startswith('http'): link = url_base.rstrip('/') + '/' + link.lstrip('/')
            pdf_path = descargar_malla_pdf(link, titulo)

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
        print(f"Error: {e}")
        return None

# --- PARTE 4: EJECUCIÓN ---
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
            "https://www.duoc.cl/carreras/tecnologia-en-sonido-e-iluminacion"
        ]
    }
    
    opciones = Options()
    opciones.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0")
    
    try:
        # Usamos tu inicializador original de Edge Chromium
        navegador = webdriver.Edge(options=opciones)
        resultados = []

        if verificar_permiso_etico(navegador, institucion['web']):
            for url in institucion['urls']:
                datos = extraer_datos_carrera(navegador, url, institucion['web'])
                if datos:
                    datos['institucion'] = institucion['nombre']
                    resultados.append(datos)
                time.sleep(3)

        # Guardado final estructurado en tu ruta original
        ruta_json = os.path.join('..', 'scraping', 'datos.json')
        os.makedirs(os.path.dirname(ruta_json), exist_ok=True)
        with open(ruta_json, 'w', encoding='utf-8') as f:
            json.dump(resultados, f, ensure_ascii=False, indent=4)
        
        print(f"\nPROCESO COMPLETADO: {len(resultados)} carreras guardadas con toda la información original y geolocalización.")

    finally:
        if 'navegador' in locals(): navegador.quit()

if __name__ == "__main__":
    iniciar_extraccion_total()