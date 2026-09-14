# Guía Rápida de Git para el Equipo 

Esta guía explica de forma sencilla y visual cómo trabajamos con Git y GitHub en nuestro proyecto escolar para mantener el orden, evitar dolores de cabeza y prevenir conflictos al unir nuestro código.

---

## 1. ¿Cómo se conectan las ramas?

Para no romper el proyecto, utilizamos tres niveles de ramas muy claros:

```mermaid
gitGraph
    commit id: "main (Estable v1.0)"
    branch sprint-1
    checkout sprint-1
    commit id: "Setup inicial sprint"
    
    branch feature/login
    checkout feature/login
    commit id: "feat: pantalla login"
    commit id: "feat: validación"
    
    checkout sprint-1
    merge feature/login id: "PR: Merge Login"
    
    branch feature/registro
    checkout feature/registro
    commit id: "feat: pantalla registro"
    
    checkout sprint-1
    merge feature/registro id: "PR: Merge Registro"
    
    checkout main
    merge sprint-1 id: "Entrega Final Sprint a main"
```

### Roles de cada rama:

* **`main`**: Es la rama oficial y sagrada. Solo recibe código cuando un Sprint termina, se prueba y funciona perfectamente. **Nadie programa directamente en `main`**.
* **`sprint-X`** *(ej. `sprint-1`, `sprint-2`)*: Es la zona de integración y pruebas del ciclo actual. Aquí se junta todo lo que el equipo va completando.
* **`feature/nombre-tarea`** *(ej. `feature/login`, `feature/perfil`)*: Es tu zona de trabajo personal. La creas a partir del sprint actual para desarrollar tu tarea sin estorbar a nadie.

---

## 2. El Ciclo de Trabajo: Paso a Paso

Imagina que te asignaron la tarea de programar el login. Este es el flujo de comunicación entre tu computadora y GitHub:

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Tú (Desarrollador)
    participant Local as Tu Computadora (Local)
    participant Remote as GitHub (Remoto)
    actor Team as Compañero (Revisor)

    Dev->>Remote: git pull origin sprint-1 (Traer cambios recientes)
    Dev->>Local: git checkout -b feature/login (Crear tu rama)
    Note over Dev,Local: Programas tu funcionalidad<br/>git add .<br/>git commit -m "feat(auth): login"
    Dev->>Remote: git push -u origin feature/login (Subir tu rama)
    Dev->>Remote: Crear Pull Request (feature/login ➔ sprint-1)
    Remote->>Team: Solicitar Code Review
    Team->>Remote: Revisa y Aprueba PR (Merge a sprint-1)
    Remote-->>Dev: Código integrado con éxito ✅
```

### Comandos que usarás en el día a día:

#### 1. Actualizar tu base
Antes de empezar a programar, asegúrate de tener la rama del sprint al día:
```bash
git checkout sprint-1
git pull origin sprint-1
```

#### 2. Crear tu rama de trabajo
Parte siempre desde la rama del sprint dándole un nombre claro a tu tarea:
```bash
git checkout -b feature/login sprint-1
```

#### 3. Guardar tus avances (Commits)
Haz commits pequeños y claros explicando qué hiciste usando *Conventional Commits* (`feat:`, `fix:`, `docs:`, etc.):
```bash
git add .
git commit -m "feat(auth): añadir diseño del formulario"
```

#### 4. Subir tu rama a GitHub
La primera vez que subas tu rama ejecuta:
```bash
git push -u origin feature/login
```
*(En subidas posteriores de la misma rama, basta con hacer `git push`)*.

#### 5. Abrir tu Pull Request (PR)
1. Ve a GitHub.
2. Crea un **Pull Request** pidiendo unir tu rama `feature/login` hacia `sprint-1`.
3. Pide a un compañero que revise tu código (**Code Review**) antes de fusionarlo.

---

## 3. Las 4 Áreas de Git: ¿Dónde están mis cambios?

Para entender qué hace cada comando, este diagrama muestra el viaje que hace tu código:

```mermaid
flowchart LR
    subgraph Tu Computadora
        WD["📂 Directorio de Trabajo<br/>(Archivos que editas)"]
        SA["📦 Staging Area<br/>(Preparados para commit)"]
        LR["💾 Repositorio Local<br/>(Historial en tu PC)"]
    end
    subgraph Nube
        GH["☁️ GitHub (Remoto)<br/>(Compartido con el equipo)"]
    end

    WD -- "git add" --> SA
    SA -- "git commit" --> LR
    LR -- "git push" --> GH
    GH -- "git pull / fetch" --> WD
```

---

## 4. ¿Cómo prevenir y resolver conflictos? 🛡️

Un conflicto ocurre cuando dos personas modifican la **misma línea del mismo archivo** al mismo tiempo.

### Diagrama de Decisión para Resolver Conflictos:

```mermaid
flowchart TD
    Inicio(["Terminaste tu tarea en tu feature branch"]) --> Fetch["1. Trae lo nuevo del sprint:<br/><code>git fetch origin sprint-1</code>"]
    Fetch --> MergeSprint["2. Intenta unirlo a tu rama:<br/><code>git merge origin/sprint-1</code>"]
    
    MergeSprint --> HayConflicto{¿Hay conflictos?}
    
    HayConflicto -- No --> TodoOk["✅ Git fusionó todo automáticamente"]
    TodoOk --> Push["3. Sube tu rama:<br/><code>git push</code>"]
    Push --> PR["4. Abre / actualiza tu Pull Request"]
    
    HayConflicto -- Sí --> Manual["⚠️ Abre los archivos marcados en VS Code"]
    Manual --> Elegir["Elige el código correcto:<br/>(Tuyo / Compañero / Combinación)"]
    Elegir --> Guardar["Guarda los archivos"]
    Guardar --> AddCommit["Marca como resuelto:<br/><code>git add .</code><br/><code>git commit -m 'fix: resolver conflictos con sprint-1'</code>"]
    AddCommit --> Push
```

### Paso a paso en la terminal para actualizar tu rama:

Estando parado en tu rama de trabajo (`feature/...`), ejecuta:

```bash
# 1. Trae los cambios más recientes del sprint
git fetch origin sprint-1

# 2. Únelos a tu rama actual
git merge origin/sprint-1
```

* **Si todo sale bien:** ¡Listo! Git combina el código de forma automática.
* **Si hay conflicto:** Git te avisará qué archivos tienen problemas:
  1. Abre el archivo en VS Code. Verás las opciones: *Accept Current Change*, *Accept Incoming Change*, o *Accept Both Changes*.
  2. Elige la opción adecuada y guarda.
  3. Ejecuta:
     ```bash
     git add .
     git commit -m "fix: resolver conflicto con sprint-1"
     git push
     ```

> 💡 **Regla de oro:** Resolver los conflictos en tu propia rama local antes de hacer el PR protege la rama del sprint y evita romper el trabajo del resto del equipo.