import os
import time
import json
import re
import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.edge.options import Options
from webdriver_manager.microsoft import EdgeChromiumDriverManager

# --- PARTE 1: COMPROBACIÓN ÉTICA (ROBOTS.TXT) ---
def verificar_permiso_etico(navegador, url_base):
    print(f"Consultando robots.txt en {url_base}...")
    try:
        navegador.get(url_base + "/robots.txt")
        time.sleep(2)
        contenido_texto = navegador.find_element("tag name", "body").text.lower()
        
        if "disallow: / " in contenido_texto or "disallow: /carreras/" in contenido_texto:
            print(f"Acceso denegado por ética en {url_base}")
            return False
            
        print("Acceso permitido. Procediendo...")
        return True
    except:
        print("No se pudo leer robots.txt, se procederá con precaución.")
        return True

# --- PARTE 2: UTILITARIOS (Descargas y Limpieza) ---
def limpiar_monto_dinero(texto):
    return re.sub(r'\D', '', texto)

def descargar_malla_pdf(enlace_pdf, nombre_carrera):
    try:
        carpeta_destino = os.path.join('..', 'Producto', 'elige-tu-futuro', 'public', 'mallas')
        if not os.path.exists(carpeta_destino):
            os.makedirs(carpeta_destino)
        
        archivo_nombre = f"malla_{nombre_carrera.replace(' ', '_').lower()}.pdf"
        ruta_archivo_final = os.path.join(carpeta_destino, archivo_nombre)
        
        respuesta = requests.get(enlace_pdf, stream=True, timeout=15)
        if respuesta.status_code == 200:
            with open(ruta_archivo_final, 'wb') as archivo:
                for bloque in respuesta.iter_content(chunk_size=1024):
                    if bloque: 
                        archivo.write(bloque)
            return f"/mallas/{archivo_nombre}"
        return None
    except Exception as error:
        print(f"Error al descargar PDF: {error}")
        return None

# --- PARTE 3: EXTRACCIÓN DETALLADA ---
def extraer_datos_carrera(navegador, url_especifica, url_base):
    print(f"\nExtrayendo datos de: {url_especifica}")
    try:
        navegador.get(url_especifica)
        navegador.execute_script("window.scrollTo(0, 600);")
        time.sleep(6) 
        
        soup_html = BeautifulSoup(navegador.page_source, 'html.parser')
        
        # 1. Obtener Título
        etiqueta_titulo = soup_html.find('h1')
        titulo_carrera = etiqueta_titulo.text.strip() if etiqueta_titulo else "Carrera sin título"
        
        # 2. Obtener Duración (Nueva lógica agregada)
        texto_completo = soup_html.get_text(" ", strip=True)
        duracion_encontrada = "No especificada"
        # Busca un número seguido de la palabra semestres
        patron_duracion = re.search(r'(\d+)\s+semestres', texto_completo, re.IGNORECASE)
        if patron_duracion:
            duracion_encontrada = f"{patron_duracion.group(1)} Semestres"

        # --- DESCRIPCIÓN Y CAMPO LABORAL ---
        resumen_descripcion = "Descripción no disponible."
        texto_campo_laboral = "Campo laboral no disponible."
        
        elementos_clave = soup_html.find_all(['h2', 'h3', 'h4', 'strong', 'div'])
        for elemento in elementos_clave:
            texto_encontrado = elemento.get_text(" ", strip=True).upper()
            if "LA CARRERA" in texto_encontrado or "PERFIL DE EGRESO" in texto_encontrado:
                siguiente = elemento.find_next(['p', 'div'])
                if siguiente: 
                    resumen_descripcion = siguiente.get_text(" ", strip=True)
            
            if "CAMPO LABORAL" in texto_encontrado or "CAMPO OCUPACIONAL" in texto_encontrado:
                siguiente = elemento.find_next(['p', 'div', 'ul'])
                if siguiente: 
                    texto_campo_laboral = siguiente.get_text(" ", strip=True)

        # --- BUSCADOR DE MALLA PDF ---
        etiqueta_pdf = soup_html.find('a', href=re.compile(r'.*\.pdf'))
        ruta_pdf_para_react = None
        if etiqueta_pdf:
            enlace_completo_pdf = etiqueta_pdf['href']
            if not enlace_completo_pdf.startswith('http'):
                enlace_completo_pdf = url_base.rstrip('/') + '/' + enlace_completo_pdf.lstrip('/')
            ruta_pdf_para_react = descargar_malla_pdf(enlace_completo_pdf, titulo_carrera)

        # --- SEDES Y ARANCELES ---
        lista_sedes_validas = ["MAIPÚ", "PLAZA OESTE", "SAN JOAQUÍN", "VIÑA DEL MAR", "PUENTE ALTO", "ALONSO DE OVALLE", "PLAZA NORTE", "MELIPILLA"]
        informacion_sedes = []
        
        for bloque_texto in soup_html.find_all(['tr', 'div', 'li', 'td']):
            linea_leida = bloque_texto.get_text(" ", strip=True).upper()
            if "$" in linea_leida:
                sede_encontrada = next((s for s in lista_sedes_validas if s in linea_leida), None)
                if sede_encontrada:
                    precios_encontrados = re.findall(r'\$\s?[\d\.]+', linea_leida)
                    if len(precios_encontrados) >= 1:
                        if not any(item['sede'] == sede_encontrada for item in informacion_sedes):
                            informacion_sedes.append({
                                "sede": sede_encontrada,
                                "matricula": limpiar_monto_dinero(precios_encontrados[0]),
                                "arancel": limpiar_monto_dinero(precios_encontrados[1]) if len(precios_encontrados) > 1 else "0"
                            })

        return {
            "nombre_carrera": titulo_carrera,
            "duracion": duracion_encontrada, # <--- Campo agregado
            "url_fuente": url_especifica,
            "descripcion": resumen_descripcion[:600],
            "campo_laboral": texto_campo_laboral[:600],
            "malla_pdf": ruta_pdf_para_react,
            "sedes": informacion_sedes
        }
    except Exception as e:
        print(f"Error al procesar carrera: {e}")
        return None

# --- PARTE 4: EL CRAWLER MAESTRO ---
def iniciar_extraccion_total():
    lista_instituciones = [
        {
            "nombre_u": "Duoc UC",
            "web_principal": "https://www.duoc.cl",
            "enlaces_a_scrapear": [
                "https://www.duoc.cl/carreras/analista-programador-2",
                "https://www.duoc.cl/carreras/ingenieria-en-informatica/",
                "https://www.duoc.cl/carreras/ingenieria-en-administracion-mencion-gestion-de-personas-2/"
            ]
        }
    ]
    
    opciones_navegador = Options()
    opciones_navegador.add_argument("--headless") 
    
    try:
        print("Arrancando el motor de búsqueda...")
        servicio_edge = Service()
        navegador = webdriver.Edge(service=servicio_edge, options=opciones_navegador)
        resultado_final_json = []

        for institucion in lista_instituciones:
            print(f"\nTRABAJANDO EN: {institucion['nombre_u']}")
            if not verificar_permiso_etico(navegador, institucion['web_principal']):
                continue

            for url in institucion['enlaces_a_scrapear']:
                datos_extraidos = extraer_datos_carrera(navegador, url, institucion['web_principal'])
                if datos_extraidos:
                    datos_extraidos['institucion'] = institucion['nombre_u']
                    resultado_final_json.append(datos_extraidos)
                time.sleep(2)

        # --- GUARDADO EN ARCHIVO JSON ---
        ruta_archivo_datos = os.path.join('..', 'Producto', 'elige-tu-futuro', 'src', 'datos.json')
        os.makedirs(os.path.dirname(ruta_archivo_datos), exist_ok=True)
        
        with open(ruta_archivo_datos, 'w', encoding='utf-8') as archivo_json:
            json.dump(resultado_final_json, archivo_json, ensure_ascii=False, indent=4)
            
        print(f"\nPROCESO FINALIZADO CON ÉXITO")
        print(f"Se han guardado {len(resultado_final_json)} carreras en: {ruta_archivo_datos}")

    except Exception as error_critico:
        print(f"Error crítico en el sistema: {error_critico}")
    finally:
        if 'navegador' in locals():
            navegador.quit()

if __name__ == "__main__":
    iniciar_extraccion_total()