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
def verificar_permiso_etico(driver, url_base):
    print(f"Consultando robots.txt en {url_base}...")
    try:
        driver.get(url_base + "/robots.txt")
        time.sleep(2)
        contenido = driver.find_element("tag name", "body").text.lower()
        
        # Bloqueo si hay prohibición total o específica
        if "disallow: / " in contenido or "disallow: /carreras/" in contenido:
            print(f"Acceso denegado por ética en {url_base}")
            return False
            
        print("Acceso permitido. Procediendo...")
        return True
    except:
        print("No se pudo leer robots.txt, se procederá con precaución.")
        return True

# --- PARTE 2: UTILITARIOS (Descargas y Limpieza) ---
def limpiar_monto(texto):
    return re.sub(r'\D', '', texto)

def descargar_pdf(url_pdf, nombre_carrera):
    try:
        # RUTA MAESTRA: Sube a raíz, entra a Producto -> elige-tu-futuro -> public -> mallas
        folder = os.path.join('..', 'Producto', 'elige-tu-futuro', 'public', 'mallas')
        
        if not os.path.exists(folder):
            os.makedirs(folder)
        
        nombre_archivo = f"malla_{nombre_carrera.replace(' ', '_').lower()}.pdf"
        ruta_final = os.path.join(folder, nombre_archivo)
        
        response = requests.get(url_pdf, stream=True, timeout=15)
        if response.status_code == 200:
            with open(ruta_final, 'wb') as f:
                for chunk in response.iter_content(chunk_size=1024):
                    if chunk: f.write(chunk)
            return f"/mallas/{nombre_archivo}" # Ruta relativa para React
        return None
    except Exception as e:
        print(f"Error descarga PDF: {e}")
        return None

# --- PARTE 3: EXTRACCIÓN DETALLADA ---
def scrapear_carrera(driver, url, url_base):
    print(f"\nExtrayendo: {url}")
    try:
        driver.get(url)
        driver.execute_script("window.scrollTo(0, 500);")
        time.sleep(8) # Tiempo para que carguen los precios dinámicos
        
        soup = BeautifulSoup(driver.page_source, 'html.parser')
        titulo = soup.find('h1').text.strip() if soup.find('h1') else "Carrera"
        
        # --- DESCRIPCIÓN Y CAMPO LABORAL ---
        descripcion = "Descripción no disponible."
        campo_laboral = "Campo laboral no disponible."
        encabezados = soup.find_all(['h2', 'h3', 'h4', 'strong', 'div'])
        
        for enc in encabezados:
            texto_enc = enc.get_text(" ", strip=True).upper()
            if "LA CARRERA" in texto_enc or "PERFIL DE EGRESO" in texto_enc:
                sig = enc.find_next(['p', 'div'])
                if sig: descripcion = sig.get_text(" ", strip=True)
            if "CAMPO LABORAL" in texto_enc or "CAMPO OCUPACIONAL" in texto_enc:
                sig = enc.find_next(['p', 'div', 'ul'])
                if sig: campo_laboral = sig.get_text(" ", strip=True)

        # --- BUSCADOR DE MALLA PDF ---
        link_malla_tag = soup.find('a', href=re.compile(r'.*\.pdf'))
        ruta_pdf_react = None
        if link_malla_tag:
            url_pdf_real = link_malla_tag['href']
            if not url_pdf_real.startswith('http'):
                url_pdf_real = url_base.rstrip('/') + '/' + url_pdf_real.lstrip('/')
            ruta_pdf_react = descargar_pdf(url_pdf_real, titulo)

        # --- SEDES Y ARANCELES ---
        sedes_validas = ["MAIPÚ", "PLAZA OESTE", "SAN JOAQUÍN", "VIÑA DEL MAR", "PUENTE ALTO", "ALONSO DE OVALLE", "PLAZA NORTE", "MELIPILLA"]
        sedes_info = []
        for item in soup.find_all(['tr', 'div', 'li', 'td']):
            linea = item.get_text(" ", strip=True).upper()
            if "$" in linea:
                sede_f = next((s for s in sedes_validas if s in linea), None)
                if sede_f:
                    precios = re.findall(r'\$\s?[\d\.]+', linea)
                    if len(precios) >= 1:
                        if not any(s['sede'] == sede_f for s in sedes_info):
                            sedes_info.append({
                                "sede": sede_f,
                                "matricula": limpiar_monto(precios[0]),
                                "arancel": limpiar_monto(precios[1]) if len(precios) > 1 else "0"
                            })

        return {
            "nombre_carrera": titulo,
            "url": url,
            "descripcion": descripcion[:600],
            "campo_laboral": campo_laboral[:600],
            "malla_pdf": ruta_pdf_react,
            "sedes": sedes_info
        }
    except Exception as e:
        print(f"❌ Error en carrera {url}: {e}")
        return None

# --- PARTE 4: EL CRAWLER MAESTRO (Multinstitución) ---
def iniciar_crawler_maestro():
    # LISTA DE INSTITUTOS (Escalable)
    institutos = [
        {
            "nombre": "Duoc UC",
            "url_base": "https://www.duoc.cl",
            "urls_objetivo": [
                "https://www.duoc.cl/carreras/analista-programador-2",
                "https://www.duoc.cl/carreras/ingenieria-en-informatica/",
                "https://www.duoc.cl/carreras/ingenieria-en-administracion-mencion-gestion-de-personas-2/"
            ]
        }
        # Puedes agregar INACAP aquí siguiendo el mismo formato
    ]
    
    edge_options = Options()
    edge_options.add_argument("--headless") # Sin ventana para ir más rápido
    
    try:
        print("Iniciando Motor de Extracción...")
        service = Service()
        driver = webdriver.Edge(service=service, options=edge_options)

        catalogo_final = []

        for inst in institutos:
            print(f"\nTRABAJANDO EN: {inst['nombre']}")
            
            if not verificar_permiso_etico(driver, inst['url_base']):
                continue

            for url in inst['urls_objetivo']:
                datos = scrapear_carrera(driver, url, inst['url_base'])
                if datos:
                    datos['institucion'] = inst['nombre'] # Etiqueta para el filtro de React
                    catalogo_final.append(datos)
                time.sleep(2) # Pausa de cortesía

        # --- GUARDADO FINAL ---
        ruta_react = os.path.join('..', 'Producto', 'elige-tu-futuro', 'src', 'datos.json')
        os.makedirs(os.path.dirname(ruta_react), exist_ok=True)
        
        with open(ruta_react, 'w', encoding='utf-8') as f:
            json.dump(catalogo_final, f, ensure_ascii=False, indent=4)
            
        print(f"\nPROCESO TERMINADO ✨")
        print(f"JSON: {ruta_react}")
        print(f"Mallas: ../Producto/elige-tu-futuro/public/mallas")

    except Exception as e:
        print(f"Error crítico: {e}")
    finally:
        if 'driver' in locals():
            driver.quit()

if __name__ == "__main__":
    iniciar_crawler_maestro()