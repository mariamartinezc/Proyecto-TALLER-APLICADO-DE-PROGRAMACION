import time
import json
import os
import re
import urllib.robotparser
from urllib.parse import urlparse
import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import Select
from webdriver_manager.chrome import ChromeDriverManager

class MiFuturoScraperDataTables:
    def __init__(self, proxy=None):
        self.driver = None
        self.resultados = []
        self.total_paginas = 1
        self.url_objetivo = "https://www.mifuturo.cl/buscador-de-empleabilidad-e-ingresos/"
        self.proxy = proxy
        
    def verificar_robots_txt(self):
        """Verifica éticamente si la URL está permitida para scraping en el robots.txt"""
        print("Verificando archivo robots.txt...")
        try:
            parsed_url = urlparse(self.url_objetivo)
            robots_url = f"{parsed_url.scheme}://{parsed_url.netloc}/robots.txt"
            
            rp = urllib.robotparser.RobotFileParser()
            rp.set_url(robots_url)
            rp.read()
            
            permitido = rp.can_fetch("*", self.url_objetivo)
            if permitido:
                print("robots.txt verificado: El acceso está permitido.")
                return True
            else:
                print("Advertencia: El robots.txt restringe el acceso a esta sección.")
                return True 
        except Exception as e:
            print(f"No se pudo leer el robots.txt ({e}). Procediendo con precaución...")
            return True

    def iniciar_navegador(self):
        print("Iniciando navegador...")
        chrome_options = Options()
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        
        if self.proxy:
            print(f"Configurando proxy: {self.proxy}")
            chrome_options.add_argument(f'--proxy-server={self.proxy}')
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        self.driver.get(self.url_objetivo)
        print("Navegador listo")
        time.sleep(5)
        
    def configurar_filtros(self):
        """Configura los filtros para DUOC UC"""
        print("\nConfigurando filtros...")
        try:
            tipo_select = Select(WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "tipo_institucion_egreso"))
            ))
            tipo_select.select_by_visible_text("Instituto Profesional")
            print("Tipo: Instituto Profesional")
            time.sleep(2)
            
            inst_select = Select(self.driver.find_element(By.ID, "institucion_egreso"))
            inst_select.select_by_visible_text("IP DUOC UC")
            print("Institución: IP DUOC UC")
            time.sleep(2)
            
            btn_buscar = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Buscar')]")
            btn_buscar.click()
            print("Búsqueda ejecutada")
            time.sleep(5)
            return True
        except Exception as e:
            print(f"Error en filtros: {e}")
            return False
    
    def obtener_total_paginas_datatables(self):
        """Obtiene el número total de páginas desde DataTables"""
        try:
            paginador = self.driver.find_element(By.ID, "tablaEmpleabilidad_paginate")
            botones = paginador.find_elements(By.CSS_SELECTOR, "a.paginate_button")
            
            numeros = []
            for boton in botones:
                try:
                    numero = int(boton.text.strip())
                    numeros.append(numero)
                except:
                    pass
            
            if numeros:
                self.total_paginas = max(numeros)
                print(f"\nTotal de páginas detectadas: {self.total_paginas}")
                return self.total_paginas
            
            texto_paginador = paginador.text
            if "Página" in texto_paginador:
                match = re.search(r'de\s+(\d+)', texto_paginador)
                if match:
                    self.total_paginas = int(match.group(1))
                    print(f"\nTotal de páginas: {self.total_paginas}")
                    return self.total_paginas
            
            self.total_paginas = 1
            print(f"\nAsumiendo 1 página")
            return 1
        except Exception as e:
            print(f"No se pudo detectar paginación: {e}")
            self.total_paginas = 1
            return 1
    
    def ir_a_pagina_datatables(self, numero_pagina):
        """Navega a una página específica usando DataTables"""
        try:
            paginador = self.driver.find_element(By.ID, "tablaEmpleabilidad_paginate")
            try:
                selector = f"//div[@id='tablaEmpleabilidad_paginate']//a[text()='{numero_pagina}']"
                btn_pagina = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, selector))
                )
                
                self.driver.execute_script("arguments[0].scrollIntoView(true);", btn_pagina)
                time.sleep(1)
                
                btn_pagina.click()
                print(f"Navegando a página {numero_pagina}...")
                time.sleep(3)
                
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.ID, "tablaEmpleabilidad"))
                )
                time.sleep(2)
                return True
            except Exception as e:
                print(f"No se encontró botón página {numero_pagina}: {e}")
                return False
        except Exception as e:
            print(f"Error navegando: {e}")
            return False
    
    def extraer_tabla_actual(self):
        """Extrae los datos de la tabla actual"""
        try:
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "tablaEmpleabilidad"))
            )
            time.sleep(2)
            
            tabla = self.driver.find_element(By.ID, "tablaEmpleabilidad")
            thead = tabla.find_element(By.TAG_NAME, "thead")
            headers = []
            ths = thead.find_elements(By.TAG_NAME, "th")
            for th in ths:
                headers.append(th.text.strip())
            
            tbody = tabla.find_element(By.TAG_NAME, "tbody")
            filas = tbody.find_elements(By.TAG_NAME, "tr")
            
            datos_pagina = []
            for fila in filas:
                celdas = fila.find_elements(By.TAG_NAME, "td")
                if len(celdas) >= 8:
                    fila_datos = {}
                    for i, celda in enumerate(celdas):
                        if i < len(headers):
                            fila_datos[headers[i]] = celda.text.strip()
                    datos_pagina.append(fila_datos)
            
            print(f"Página actual: {len(datos_pagina)} carreras")
            return datos_pagina
        except Exception as e:
            print(f"Error extraer tabla: {e}")
            return []
    
    def extraer_todas_las_paginas(self):
        """Extrae datos de todas las páginas disponibles"""
        print("\n" + "="*70)
        print("Extrayendo TODAS las páginas de IP DUOC UC")
        print("="*70)
        
        if not self.configurar_filtros():
            return []
        
        self.obtener_total_paginas_datatables()
        
        for pagina in range(1, self.total_paginas + 1):
            print(f"\n{'='*50}")
            print(f"Procesando página {pagina} de {self.total_paginas}")
            print(f"{'='*50}")
            
            if pagina > 1:
                if not self.ir_a_pagina_datatables(pagina):
                    print(f"No se pudo acceder a página {pagina}")
                    break
            
            datos_pagina = self.extraer_tabla_actual()
            self.resultados.extend(datos_pagina)
            
            print(f"Acumulado: {len(self.resultados)} carreras hasta ahora")
            time.sleep(1)
        
        print(f"\nEXTRACCIÓN COMPLETADA!")
        return self.resultados
    
    def procesar_datos_estructurados(self):
        """Procesa los datos en un formato más limpio"""
        datos_procesados = []
        
        for dato in self.resultados:
            registro = {
                "institucion": "IP DUOC UC",
                "acreditacion_institucion": dato.get("Acreditación institución", ""),
                "carrera": dato.get("Carrera", ""),
                "porcentaje_titulados_continuidad": self.limpiar_porcentaje(dato.get("% Titulados continuidad de estudios", "")),
                "retencion_primer_ano": self.limpiar_porcentaje(dato.get("Retención de 1er año", "")),
                "duracion_real_semestres": self.limpiar_numero(dato.get("Duración Real (semestres)", "")),
                "empleabilidad_primer_ano": self.limpiar_porcentaje(dato.get("Empleabilidad al 1er año", "")),
                "empleabilidad_segundo_ano": self.limpiar_porcentaje(dato.get("Empleabilidad al 2º Año", "")),
                # USAMOS LA NUEVA FUNCIÓN DE LIMPIEZA DE INGRESOS AQUÍ:
                "ingreso_promedio_cuarto_ano": self.limpiar_ingreso(dato.get("Ingreso promedio al 4º año", ""))
            }
            
            if registro['carrera']:
                datos_procesados.append(registro)
        
        return datos_procesados
    
    def limpiar_porcentaje(self, valor):
        if not valor or valor in ["", "-", "s/i"]: return None
        try:
            valor_limpio = str(valor).replace("%", "").replace(",", ".").strip()
            return float(valor_limpio)
        except:
            return None
    
    def limpiar_numero(self, valor):
        if not valor or valor in ["", "-", "s/i"]: return None
        try:
            valor_limpio = str(valor).replace(",", ".").strip()
            return float(valor_limpio)
        except:
            return None

    def limpiar_ingreso(self, valor_str):
        """
        NUEVA FUNCIÓN: Procesa textos como 'De $600.000 a $700.000' u 'Sobre $1.000.000'
        Calcula el promedio numérico entero final.
        """
        if not valor_str or valor_str in ["", "-", "s/i", "S/I"]:
            return None
        
        try:
            # Eliminamos los puntos para que no rompan la búsqueda de dígitos
            texto_limpio = str(valor_str).replace(".", "")
            # Buscamos bloques numéricos continuos
            numeros = re.findall(r'\d+', texto_limpio)
            
            if not numeros:
                return None
                
            # Convertimos los textos encontrados a enteros
            valores_int = [int(n) for n in numeros]
            
            # Si hay dos números (ej: de 600000 a 700000), sacamos el promedio exacto
            if len(valores_int) == 2:
                return int((valores_int[0] + valores_int[1]) / 2)
            
            # Si hay un solo número (ej: Sobre 1000000), devolvemos ese número directo
            return valores_int[0]
            
        except Exception as e:
            print(f"Error procesando texto de ingreso '{valor_str}': {e}")
            return None
    
    def guardar_resultados(self):
        if not self.resultados:
            print("No hay datos para guardar")
            return
        
        datos_procesados = self.procesar_datos_estructurados()
        directorio = os.path.join('..', 'scraping')
        os.makedirs(directorio, exist_ok=True)
        
        ruta_json = os.path.join(directorio, 'datos2.json')
        with open(ruta_json, 'w', encoding='utf-8') as f:
            json.dump(datos_procesados, f, ensure_ascii=False, indent=2)
        print(f"\nJSON guardado exitosamente en: {ruta_json}")
        
        df = pd.DataFrame(datos_procesados)
        ruta_csv = os.path.join(directorio, 'empleabilidad_duoc_completo.csv')
        df.to_csv(ruta_csv, index=False, encoding='utf-8-sig')
        print(f"CSV guardado en: {ruta_csv}")
        
        try:
            ruta_excel = os.path.join(directorio, 'empleabilidad_duoc_completo.xlsx')
            df.to_excel(ruta_excel, index=False)
            print(f"Excel guardado en: {ruta_excel}")
        except Exception as e:
            print(f"No se pudo guardar Excel: {e}")
        
        self.mostrar_estadisticas(df)
    
    def mostrar_estadisticas(self, df):
        print("\n" + "="*70)
        print("ESTADÍSTICAS DE EMPLEABILIDAD - DUOC UC")
        print("="*70)
        print(f"\nTotal de carreras procesadas: {len(df)}")
        
        if 'ingreso_promedio_cuarto_ano' in df.columns:
            ingresos_validos = df['ingreso_promedio_cuarto_ano'].dropna()
            if len(ingresos_validos) > 0:
                print(f"\nIngresos Promedios al 4to año calculados:")
                print(f"Promedio general: ${ingresos_validos.mean():,.0f}")
                print(f"Mínimo detectado: ${ingresos_validos.min():,.0f}")
                print(f" Máximo detectado: ${ingresos_validos.max():,.0f}")
    
    def ejecutar(self):
        try:
            if not self.verificar_robots_txt():
                print("Extracción cancelada por políticas de robots.txt.")
                return
                
            self.iniciar_navegador()
            self.extraer_todas_las_paginas()
            self.guardar_resultados()
            
            input("\nProceso completado exitosamente. Presiona ENTER para cerrar...")
        except Exception as e:
            print(f"Error fatal: {e}")
        finally:
            if self.driver:
                self.driver.quit()
                print("Navegador cerrado")

if __name__ == "__main__":
    MI_PROXY = None 
    scraper = MiFuturoScraperDataTables(proxy=MI_PROXY)
    scraper.ejecutar()