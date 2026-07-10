# Elige Tu Futuro 

Bienvenido al repositorio oficial de **"Elige Tu Futuro"**, un portal web interactivo diseñado para centralizar la oferta académica, mallas curriculares, aranceles y beneficios socioeconómicos de la educación superior en Chile.

 **Link del proyecto en producción:** [elige-tu-futuro-pied.vercel.app](https://elige-tu-futuro-pied.vercel.app)

---

##  Integrantes
* **Nayadett Leyton**
* **Lorena Figueroa**
* **María Martínez**

*Duoc UC - Proyecto de Portafoleo 2026*

---

##  Estructura del Repositorio

Para facilitar la revisión por parte de la comisión evaluadora, el repositorio está organizado de la siguiente manera:

* **` Documento/`**
    * Contiene la documentación oficial desarrollada a lo largo del semestre, abarcando el progreso de la **Experiencia 1 a la Experiencia 3**.
    * **` examen/`**: Subcarpeta crítica que contiene toda la **documentación corregida y actualizada** con las observaciones finales para el examen del día viernes 10/07/2026.
* **` Proyecto/`**
    * Contiene el código fuente de la aplicación listo para producción.
    * **` frontend/`**: Interfaz de usuario interactiva construida en **React (PWA)** y desplegada en Vercel.
    * **` backend/`**: Configuraciones, triggers y políticas RLS de la base de datos relacional en **Supabase (PostgreSQL)**.
    * **` scraping/`**: Scripts de automatización en **Python (Selenium / BeautifulSoup)** para la extracción de mallas, aranceles y empleabilidad.
* **` .github/workflows/`**
    * **` scraping-pipeline.yml`**: Configuración de **GitHub Actions** que automatiza el respaldo y ejecución mensual del motor de scraping.

---

##  Tecnologías Utilizadas

* **Frontend:** React, JavaScript, HTML5, CSS3 (Desplegado en **Vercel**).
* **Backend & Base de Datos:** PostgreSQL (**Supabase**), Autenticación JWT, Row Level Security (RLS).
* **Automatización & Scraping:** Python, Selenium, BeautifulSoup (Pipeline en **GitHub Actions**).

---
##  Instrucciones para Clonar y Ejecutar el Proyecto

Siga estos pasos para descargar una copia local del proyecto y abrirlo en su entorno de desarrollo:

###  Requisitos Previos
Asegúrese de tener instalado en su equipo:
* **Git** (v2.x o superior)
* **Visual Studio Code** 
* **Node.js** & **Python 3.10+** 

---

###  Guía de Clonado Paso a Paso

1. **Abra la terminal** de su sistema (CMD, PowerShell o Git Bash) y muévase a la carpeta donde desea almacenar el proyecto:
   ```bash
   cd ruta/de/tu/carpeta/de/proyectos

2. **Clone el repositorio ejecutando el siguiente comando:**
   ```bash
   git clone [https://github.com/mariamartinezc/Proyecto-TALLER-APLICADO-DE-PROGRAMACION.git](https://github.com/mariamartinezc/Proyecto-TALLER-APLICADO-DE-PROGRAMACION.git)
3. **Acceda al directorio del proyecto que se acaba de crear:**
   ```bash
   cd Proyecto-TALLER-APLICADO-DE-PROGRAMACION
4. **Abra el proyecto en Visual Studio Code directamente desde la consola:**
   ```bash
    code .