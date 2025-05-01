document.addEventListener("DOMContentLoaded", function () {
  /**************************************************
   * NebulaCode Editor - Ultimate Developer Environment
   **************************************************/

  /* --- Loading Overlay Setup --- */
  const loadingOverlay = document.createElement("div");
  loadingOverlay.id = "loading-overlay";
  loadingOverlay.innerHTML = '<div class="loading-message">NebulaCode is Opening<span class="dots"></span></div>';
  document.body.appendChild(loadingOverlay);

  /* --- Profile Card Setup --- */
  // Retrieve user data from localStorage (set during login/signup)
  const userData = JSON.parse(localStorage.getItem("user"));
  const userPhotoEl = document.getElementById("user-profile");
  if (!userData) {
    alert("User data missing. Redirecting to login.");
    window.location.href = "entry.html";
    return;
  }
  // Set user photo (ensure fallback image is available)
  userPhotoEl.src = userData.photoURL || "default-avatar.png";

  // Create a floating profile card (hidden by default)
  const profileCard = document.createElement("div");
  profileCard.className = "profile-card";
  // For security reasons, you normally would not show the password. Here we mask it.
  profileCard.innerHTML = `
    <p><strong>Name:</strong> ${userData.displayName || "N/A"}</p>
    <p><strong>Email:</strong> ${userData.email || "N/A"}</p>
    <p><strong>Password:</strong> ${userData.password ? "******" : "N/A"}</p>
  `;
  document.body.appendChild(profileCard);
  profileCard.style.display = "none";

  // Toggle the profile card on click of the user photo
  userPhotoEl.addEventListener("click", (e) => {
    e.stopPropagation();
    if (profileCard.style.display === "none") {
      showProfileCard();
    } else {
      hideProfileCard();
    }
  });
  // Hide profile card when clicking outside of it
  document.addEventListener("click", () => {
    if (profileCard.style.display === "block") {
      hideProfileCard();
    }
  });
  function showProfileCard() {
    profileCard.style.display = "block";
    const rect = userPhotoEl.getBoundingClientRect();
    const cardWidth = profileCard.offsetWidth;
    // Position the card below the photo, centered horizontally
    const left = rect.left + rect.width / 2 - cardWidth / 2;
    const top = rect.bottom + 8;
    profileCard.style.left = `${left}px`;
    profileCard.style.top = `${top}px`;
    profileCard.style.opacity = "1";
    profileCard.style.transform = "translateY(0)";
  }
  function hideProfileCard() {
    profileCard.style.opacity = "0";
    profileCard.style.transform = "translateY(5px)";
    setTimeout(() => {
      profileCard.style.display = "none";
    }, 300);
  }

  // ---- Inject Additional CSS Rules (for workspace panel & others) ----
  const styleEl = document.createElement("style");
  styleEl.innerHTML = `
    /* Workspace Panel Layout */
    #workspace.max-editor #editor-panel {
      width: 100%;
      opacity: 1;
      pointer-events: auto;
    }
    #workspace.max-editor #output-panel {
      width: 0;
      opacity: 0;
      pointer-events: none;
    }
    #workspace.split-view #editor-panel {
      width: 50%;
      opacity: 1;
      pointer-events: auto;
    }
    #workspace.split-view #output-panel {
      width: 50%;
      opacity: 1;
      pointer-events: auto;
    }
    #workspace.max-output #editor-panel {
      width: 0;
      opacity: 0;
      pointer-events: none;
    }
    #workspace.max-output #output-panel {
      width: 100%;
      opacity: 1;
      pointer-events: auto;
    }
    
    @media (max-width: 768px) {
      #app { height: calc(100vh - 60px); }
      #sidebar {
        position: fixed;
        top: 60px;
        left: 0;
        width: 80%;
        height: calc(100vh - 60px);
        background: rgba(30, 30, 47, 0.95);
        z-index: 300;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
      }
      #sidebar.visible { transform: translateX(0); }
    }
    
    /* Output Panel Styling using CSS Variables */
    #output-panel {
      background: var(--output-bg);
      color: var(--output-text);
      border: 1px solid var(--output-border);
      border-radius: 8px;
      margin: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      display: flex;
      flex-direction: column;
      position: relative;
      width: 50%;
      transition: background 0.3s, color 0.3s, border 0.3s;
    }
    
    /* Only active output section is visible */
    #live-content,
    #terminal-content,
    #docs-content {
      display: none;
      height: 100%;
      width: 100%;
    }
    #live-content.active,
    #terminal-content.active,
    #docs-content.active { display: block; }
  `;
  document.head.appendChild(styleEl);

  // ---- Global Data & Variables ----
  let project = {
    files: {
      "index.html": `<!DOCTYPE html>
<html>
  <head>
    <title>Welcome to NebulaCode</title>
    <link rel="stylesheet" href="css/style.css">
  </head>
  <body>
    <h1>Hello, NebulaCode!</h1>
    <p>Your journey begins here.</p>
    <script src="js/app.js"></script>
  </body>
</html>`,
      "css/style.css": `body { font-family: sans-serif; background: #f0f0f0; color: #333; }`,
      "js/app.js": `console.log('Hello from js/app.js');`
    },
    folders: {}
  };
  
  let currentFolder = "";
  let activeFolder = "";
  let activeFile = "index.html";
  let openTabs = [];
  let deleteTarget = "";
  let deleteType = ""; // "file" or "folder"
  let expandedFolders = {};

  // ---- Page Theme Handling (Dark/Light) ----
  const pageThemes = {
    dark: {
      "--bg": "#141414",
      "--text": "#e0e0e0",
      "--accent": "#0a9396",
      "--border": "#333333",
      "--output-bg": "#1a1a1a",
      "--output-text": "#e0e0e0",
      "--output-border": "#444444"
    },
    light: {
      "--bg": "#f2f2f2",
      "--text": "#333333",
      "--accent": "#0077cc",
      "--border": "#cccccc",
      "--output-bg": "#ffffff",
      "--output-text": "#333333",
      "--output-border": "#dddddd"
    }
  };
  
  function applyPageTheme(theme) {
    const properties = pageThemes[theme];
    for (let key in properties) {
      document.documentElement.style.setProperty(key, properties[key]);
    }
  }
  
  const storedPageTheme = localStorage.getItem("pageTheme") || "dark";
  applyPageTheme(storedPageTheme);
  const pageThemeSelect = document.getElementById("page-theme-select");
  if (pageThemeSelect) {
    pageThemeSelect.value = storedPageTheme;
    pageThemeSelect.addEventListener("change", (e) => {
      const newTheme = e.target.value;
      applyPageTheme(newTheme);
      localStorage.setItem("pageTheme", newTheme);
    });
  }
  
  // ---- Media Extensions ----
  const mediaExtensions = ["png", "jpg", "jpeg", "gif", "svg", "mp4", "webm", "ogg", "mp3", "wav", "aac"];
  
  // ---- Helper Function: getMimeType ----
  function getMimeType(filePath) {
    const ext = filePath.split(".").pop().toLowerCase();
    const mimeTypes = {
      "html": "text/html",
      "htm": "text/html",
      "css": "text/css",
      "js": "text/javascript",
      "json": "application/json",
      "png": "image/png",
      "jpg": "image/jpeg",
      "jpeg": "image/jpeg",
      "gif": "image/gif",
      "svg": "image/svg+xml",
      "mp4": "video/mp4",
      "webm": "video/webm",
      "ogg": "video/ogg",
      "mp3": "audio/mpeg",
      "wav": "audio/wav",
      "aac": "audio/aac"
    };
    return mimeTypes[ext] || "text/plain";
  }
  
  // ---- Helper Function: resolveRelativePaths ----
  function resolveRelativePaths(htmlContent, baseFolder) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    
    // Process <link> elements (typically CSS)
    const links = doc.querySelectorAll("link[href]");
    links.forEach(link => {
      const href = link.getAttribute("href");
      if (!/^https?:\/\//.test(href) && !href.startsWith("/")) {
        const resolvedPath = baseFolder ? `${baseFolder}/${href}` : href;
        if (project.files[resolvedPath]) {
          const mime = getMimeType(resolvedPath);
          let blobURL;
          if (mediaExtensions.includes(resolvedPath.split(".").pop().toLowerCase())) {
            blobURL = project.files[resolvedPath];
          } else {
            const blob = new Blob([project.files[resolvedPath]], { type: mime });
            blobURL = URL.createObjectURL(blob);
          }
          link.setAttribute("href", blobURL);
        }
      }
    });
    
    // Process <script> elements (JS)
    const scripts = doc.querySelectorAll("script[src]");
    scripts.forEach(script => {
      const src = script.getAttribute("src");
      if (!/^https?:\/\//.test(src) && !src.startsWith("/")) {
        const resolvedPath = baseFolder ? `${baseFolder}/${src}` : src;
        if (project.files[resolvedPath]) {
          const mime = getMimeType(resolvedPath);
          const blob = new Blob([project.files[resolvedPath]], { type: mime });
          const blobURL = URL.createObjectURL(blob);
          script.setAttribute("src", blobURL);
        }
      }
    });
    
    // Process <img> elements (Images)
    const imgs = doc.querySelectorAll("img[src]");
    imgs.forEach(img => {
      const src = img.getAttribute("src");
      if (!/^https?:\/\//.test(src) && !src.startsWith("/")) {
        const resolvedPath = baseFolder ? `${baseFolder}/${src}` : src;
        if (project.files[resolvedPath]) {
          let blobURL = project.files[resolvedPath];
          if (!blobURL.startsWith("data:")) {
            const mime = getMimeType(resolvedPath);
            const blob = new Blob([project.files[resolvedPath]], { type: mime });
            blobURL = URL.createObjectURL(blob);
          }
          img.setAttribute("src", blobURL);
        }
      }
    });
    
    // Process <video> and <audio> elements and their <source> children.
    ["video", "audio"].forEach(tag => {
      const mediaElements = doc.querySelectorAll(`${tag}[src]`);
      mediaElements.forEach(media => {
        const src = media.getAttribute("src");
        if (!/^https?:\/\//.test(src) && !src.startsWith("/")) {
          const resolvedPath = baseFolder ? `${baseFolder}/${src}` : src;
          if (project.files[resolvedPath]) {
            let blobURL = project.files[resolvedPath];
            if (!blobURL.startsWith("data:")) {
              const mime = getMimeType(resolvedPath);
              const blob = new Blob([project.files[resolvedPath]], { type: mime });
              blobURL = URL.createObjectURL(blob);
            }
            media.setAttribute("src", blobURL);
          }
        }
      });
      const sourceElements = doc.querySelectorAll(`${tag} source`);
      sourceElements.forEach(source => {
        const src = source.getAttribute("src");
        if (!/^https?:\/\//.test(src) && !src.startsWith("/")) {
          const resolvedPath = baseFolder ? `${baseFolder}/${src}` : src;
          if (project.files[resolvedPath]) {
            let blobURL = project.files[resolvedPath];
            if (!blobURL.startsWith("data:")) {
              const mime = getMimeType(resolvedPath);
              const blob = new Blob([project.files[resolvedPath]], { type: mime });
              blobURL = URL.createObjectURL(blob);
            }
            source.setAttribute("src", blobURL);
          }
        }
      });
    });
    
    return "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
  }
  
  // ---- Helper Function: determineMode ----
  function determineMode(fileName) {
    const ext = fileName.split(".").pop().toLowerCase();
    if (["html", "htm"].includes(ext)) return "htmlmixed";
    if (ext === "css") return "css";
    if (ext === "js" || ext === "ts") return "javascript";
    if (ext === "py") return "python";
    if (ext === "c") return "text/x-csrc";
    return "plaintext";
  }
  
  // ---- Simple Documentation (Placeholder) ----
  function updateDocumentation() {
    document.getElementById("doc-content").innerHTML =
      `<p>Documentation for the active language will appear here.</p>`;
  }
  
  // ---- Tree (Sidebar) Building Functions ----
  function buildTreeFromFiles() {
    const tree = { folders: {}, files: [] };
    let defaultFiles = [];
    for (let key in project.files) {
      if (key.indexOf("/") === -1) {
        defaultFiles.push({ name: key, path: key, content: project.files[key] });
      } else {
        const parts = key.split("/");
        if (!project.folders.hasOwnProperty(parts[0])) {
          defaultFiles.push({ name: parts[parts.length - 1], path: key, content: project.files[key] });
        }
      }
    }
    if (defaultFiles.length > 0) {
      tree.folders["Root Folder"] = { folders: {}, files: defaultFiles };
    }
    for (let key in project.files) {
      if (key.indexOf("/") !== -1) {
        const parts = key.split("/");
        if (project.folders.hasOwnProperty(parts[0])) {
          let cur = tree;
          parts.slice(0, parts.length - 1).forEach(part => {
            if (!cur.folders[part]) {
              cur.folders[part] = { folders: {}, files: [] };
            }
            cur = cur.folders[part];
          });
          cur.files.push({ name: parts[parts.length - 1], path: key, content: project.files[key] });
        }
      }
    }
    for (let folderPath in project.folders) {
      if (folderPath === "" || folderPath === "Root Folder") continue;
      const parts = folderPath.split("/");
      let cur = tree;
      parts.forEach(part => {
        if (!cur.folders[part]) {
          cur.folders[part] = { folders: {}, files: [] };
        }
        cur = cur.folders[part];
      });
    }
    return tree;
  }
  
  function filterTree(tree, query) {
    const res = { folders: {}, files: [] };
    res.files = tree.files.filter(file => file.name.toLowerCase().includes(query));
    for (let folderName in tree.folders) {
      const sub = filterTree(tree.folders[folderName], query);
      if (
        folderName.toLowerCase().includes(query) ||
        sub.files.length > 0 ||
        Object.keys(sub.folders).length > 0
      ) {
        res.folders[folderName] = sub;
      }
    }
    return res;
  }
  
  function renderTree(tree, container, folderPath = "") {
    tree.files.forEach(file => {
      const li = document.createElement("li");
      li.className = "file-item";
      if (file.path === activeFile) li.classList.add("selected");
      li.innerHTML = `
        <span class="file-name">${file.name}</span>
        <button class="delete-btn" title="Delete File">
          <i class="fa-solid fa-trash"></i>
        </button>
      `;
      li.querySelector(".file-name").addEventListener("click", (e) => {
        e.stopPropagation();
        activeFolder = "";
        setActiveFile(file.path);
      });
      li.querySelector(".delete-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        deleteTarget = file.path;
        deleteType = "file";
        showModal("modal-confirm-delete");
      });
      container.appendChild(li);
    });
    for (let subFolderName in tree.folders) {
      const subFolder = tree.folders[subFolderName];
      const li = document.createElement("li");
      li.className = "folder-item";
      const fullFolderPath = folderPath ? `${folderPath}/${subFolderName}` : subFolderName;
      li.innerHTML = `
        <span class="folder-label">
          <i class="arrow" style="transform: rotate(${expandedFolders[fullFolderPath] ? "45deg" : "-45deg"});"></i> ${subFolderName}
        </span>
        <button class="delete-btn" title="Delete Folder">
          <i class="fa-solid fa-trash"></i>
        </button>
      `;
      li.querySelector(".arrow").addEventListener("click", (e) => {
        e.stopPropagation();
        expandedFolders[fullFolderPath] = !expandedFolders[fullFolderPath];
        updateSidebar();
      });
      li.querySelector(".folder-label").addEventListener("click", (e) => {
        e.stopPropagation();
        currentFolder = fullFolderPath;
        activeFolder = fullFolderPath;
        activeFile = "";
        updateSidebar();
        updateFileTabs();
      });
      li.querySelector(".delete-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        deleteTarget = fullFolderPath;
        deleteType = "folder";
        showModal("modal-confirm-delete");
      });
      container.appendChild(li);
      if (expandedFolders[fullFolderPath]) {
        const nestedUl = document.createElement("ul");
        nestedUl.style.display = "block";
        renderTree(subFolder, nestedUl, fullFolderPath);
        container.appendChild(nestedUl);
      }
    }
  }
  
  function updateSidebar() {
    const container = document.getElementById("sections-container");
    container.innerHTML = "";
    let tree = buildTreeFromFiles();
    const query = document.getElementById("search-bar").value.trim().toLowerCase();
    if (query) { tree = filterTree(tree, query); }
    const ul = document.createElement("ul");
    renderTree(tree, ul);
    container.appendChild(ul);
  }
  
  // ---- File Tabs Management ----
  function updateFileTabs() {
    const tabs = document.getElementById("file-tabs");
    tabs.innerHTML = "";
    let filtered = [];
    if (currentFolder === "Root Folder" || currentFolder === "") {
      filtered = openTabs.filter(path => {
        if (path.indexOf("/") === -1) return true;
        let parts = path.split("/");
        return !project.folders.hasOwnProperty(parts[0]);
      });
    } else {
      filtered = openTabs.filter(path => path.startsWith(currentFolder + "/"));
    }
    filtered.forEach(path => {
      const tab = document.createElement("div");
      tab.className = "tab";
      if (path === activeFile) tab.classList.add("active");
      const fname = path.split("/").pop();
      tab.innerHTML = `<span>${fname}</span>
                       <button class="close-btn"><i class="fa-solid fa-xmark"></i></button>`;
      tab.querySelector(".close-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        openTabs = openTabs.filter(item => item !== path);
        updateFileTabs();
      });
      tab.addEventListener("click", () => {
        activeFolder = "";
        setActiveFile(path);
      });
      tabs.appendChild(tab);
    });
  }
  
  function setActiveFile(filePath) {
    activeFile = filePath;
    activeFolder = "";
    if (!openTabs.includes(filePath)) {
      openTabs.push(filePath);
    }
    const ext = filePath.split(".").pop().toLowerCase();
    if (mediaExtensions.includes(ext)) {
      codeMirrorEditor.setValue(`[Media file "${filePath}" cannot be edited as text]`);
    } else {
      codeMirrorEditor.setValue(project.files[activeFile] || "");
    }
    codeMirrorEditor.setOption("mode", determineMode(activeFile));
    updateFileTabs();
    updateSidebar();
    updateDocumentation();
    saveProject();
  }
  
  // ---- Autosave & Persistence ----
  function saveProject() {
    localStorage.setItem("nebulaCodeProject", JSON.stringify(project));
    console.log("Project saved.");
  }
  
  function loadProject() {
    const saved = localStorage.getItem("nebulaCodeProject");
    if (saved) {
      project = JSON.parse(saved);
      console.log("Project loaded from localStorage.");
    } else {
      console.log("No saved project found.");
    }
  }
  
  // ---- Modal Handling ----
  function showModal(modalId) {
    document.getElementById("modal-overlay").classList.add("visible");
    document.getElementById(modalId).classList.add("visible");
  }
  
  function hideModal(modalId) {
    document.getElementById(modalId).classList.remove("visible");
    document.getElementById("modal-overlay").classList.remove("visible");
  }
  
  // ---- Creation & Deletion Events ----
  document.getElementById("create-file-btn").addEventListener("click", () => {
    document.getElementById("new-file-name").value = "";
    showModal("modal-create-file");
  });
  
  document.getElementById("create-file-confirm").addEventListener("click", () => {
    const fileName = document.getElementById("new-file-name").value.trim();
    if (!fileName) return;
    const folder = (currentFolder === "Root Folder" || currentFolder === "") ? "" : currentFolder;
    const newFile = folder ? `${folder}/${fileName}` : fileName;
    if (project.files[newFile]) {
      alert("File already exists!");
      return;
    }
    project.files[newFile] = "";
    if (folder && folder !== "Root Folder" && !project.folders[folder]) {
      project.folders[folder] = true;
    }
    activeFolder = "";
    setActiveFile(newFile);
    updateSidebar();
    updateFileTabs();
    saveProject();
    hideModal("modal-create-file");
  });
  
  document.getElementById("create-file-cancel").addEventListener("click", () => {
    hideModal("modal-create-file");
  });
  
  document.getElementById("create-folder-btn").addEventListener("click", () => {
    document.getElementById("new-folder-name").value = "";
    showModal("modal-create-folder");
  });
  
  document.getElementById("create-folder-confirm").addEventListener("click", () => {
    const folderName = document.getElementById("new-folder-name").value.trim();
    if (!folderName) return;
    const folder = (currentFolder === "Root Folder" || currentFolder === "") ? "" : currentFolder;
    const newFolder = folder ? `${folder}/${folderName}` : folderName;
    if (newFolder === "Root Folder") {
      alert('The folder name "Root Folder" is reserved.');
      return;
    }
    if (project.folders[newFolder]) {
      alert("Folder already exists!");
      return;
    }
    project.folders[newFolder] = true;
    updateSidebar();
    saveProject();
    hideModal("modal-create-folder");
  });
  
  document.getElementById("create-folder-cancel").addEventListener("click", () => {
    hideModal("modal-create-folder");
  });
  
  function deleteFile(filePath) {
    if (Object.keys(project.files).length === 1) {
      alert("Cannot delete the only file.");
      return;
    }
    delete project.files[filePath];
    openTabs = openTabs.filter(item => item !== filePath);
    if (activeFile === filePath) {
      activeFile = Object.keys(project.files)[0];
      codeMirrorEditor.setValue(project.files[activeFile]);
    }
    updateSidebar();
    updateFileTabs();
    saveProject();
  }
  
  function deleteFolder(folderPath) {
    Object.keys(project.files).forEach(key => {
      if(key === folderPath || key.startsWith(folderPath + "/")){
        delete project.files[key];
      }
    });
    Object.keys(project.folders).forEach(key => {
      if(key === folderPath || key.startsWith(folderPath + "/")){
        delete project.folders[key];
      }
    });
    Object.keys(expandedFolders).forEach(key => {
      if(key === folderPath || key.startsWith(folderPath + "/")){
        delete expandedFolders[key];
      }
    });
    if (currentFolder === folderPath || currentFolder.startsWith(folderPath + "/")) {
      currentFolder = "";
    }
    if (activeFile.startsWith(folderPath + "/")) {
      activeFile = Object.keys(project.files)[0] || "";
    }
    openTabs = openTabs.filter(path => !path.startsWith(folderPath + "/"));
    updateSidebar();
    updateFileTabs();
    saveProject();
  }
  
  document.getElementById("delete-confirm").addEventListener("click", () => {
    if (deleteType === "file") {
      deleteFile(deleteTarget);
    } else if (deleteType === "folder") {
      deleteFolder(deleteTarget);
    }
    hideModal("modal-confirm-delete");
  });
  
  document.getElementById("delete-cancel").addEventListener("click", () => {
    hideModal("modal-confirm-delete");
  });
  
  // ---- CodeMirror Setup & Hint Helper ----
  CodeMirror.registerHelper("hint", "customHint", function (cm) {
    const cur = cm.getCursor();
    const token = cm.getTokenAt(cur);
    const currentWord = token.string.slice(token.start, cur.ch);
    let candidates = [];
    const mode = cm.getOption("mode");
    if (mode === "htmlmixed") {
      candidates = ["html", "head", "body", "div", "span", "script", "style"].filter(tag => tag.startsWith(currentWord));
    } else if (mode === "css") {
      candidates = ["color", "background", "width", "height", "margin", "padding"].filter(prop => prop.startsWith(currentWord));
    } else if (mode === "javascript") {
      candidates = ["function", "var", "let", "const", "if", "else", "for", "while"].filter(kw => kw.startsWith(currentWord));
    }
    if (!currentWord) return null;
    if (candidates.length) {
      return {
        list: [candidates[0]],
        from: CodeMirror.Pos(cur.line, token.start),
        to: CodeMirror.Pos(cur.line, cur.ch)
      };
    }
    return null;
  });
  
  let codeMirrorEditor = CodeMirror.fromTextArea(document.getElementById("code-editor"), {
    lineNumbers: true,
    mode: "htmlmixed",
    theme: "dracula",
    gutters: ["CodeMirror-lint-markers"],
    lint: true,
    extraKeys: {
      "Ctrl-Space": function (cm) {
        cm.showHint({ hint: CodeMirror.hint.customHint, completeSingle: true });
      },
      Tab: "indentMore"
    }
  });
  
  codeMirrorEditor.setSize("100%", "100%");
  codeMirrorEditor.on("inputRead", function (cm, change) {
    if (change.text[0] && /[a-zA-Z<]/.test(change.text[0])) {
      cm.showHint({ hint: CodeMirror.hint.customHint, completeSingle: true });
    }
  });
  
  const debouncedSaveProject = debounce(() => {
    project.files[activeFile] = codeMirrorEditor.getValue();
    saveProject();
    updateSidebar();
  }, 500);
  
  codeMirrorEditor.on("change", debouncedSaveProject);
  
  // ---- Theme Toggling & Editor Theme Selection ----
  const storedEditorTheme = localStorage.getItem("editorTheme") || "dracula";
  document.getElementById("theme-select").value = storedEditorTheme;
  codeMirrorEditor.setOption("theme", storedEditorTheme);
  document.getElementById("theme-select").addEventListener("change", (e) => {
    const newTheme = e.target.value;
    codeMirrorEditor.setOption("theme", newTheme);
    localStorage.setItem("editorTheme", newTheme);
  });
  
  const storedThemeToggle = localStorage.getItem("theme") || "dark";
  if (storedThemeToggle === "light") {
    document.body.classList.add("light-mode");
    document.getElementById("theme-toggle").innerHTML = '<i class="fa-solid fa-sun"></i>';
  } else {
    document.body.classList.remove("light-mode");
    document.getElementById("theme-toggle").innerHTML = '<i class="fa-solid fa-moon"></i>';
  }
  document.getElementById("theme-toggle").addEventListener("click", () => {
    if (document.body.classList.contains("light-mode")) {
      document.body.classList.remove("light-mode");
      localStorage.setItem("theme", "dark");
      document.getElementById("theme-toggle").innerHTML = '<i class="fa-solid fa-moon"></i>';
    } else {
      document.body.classList.add("light-mode");
      localStorage.setItem("theme", "light");
      document.getElementById("theme-toggle").innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
  });
  
  // ---- Upload & Download Handlers ----
  document.getElementById("upload-file").addEventListener("click", function(){
    document.getElementById("file-input").click();
  });
  
  document.getElementById("file-input").addEventListener("change", function(e){
    if(e.target.files.length > 0){
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = function(ev){
        const content = ev.target.result;
        const targetFolder = (currentFolder && currentFolder !== "Root Folder") ? currentFolder + "/" : "";
        const filePath = targetFolder + file.name;
        if(project.files[filePath]){
          if(!confirm("File already exists. Overwrite?"))
            return;
        }
        const ext = file.name.split(".").pop().toLowerCase();
        if (mediaExtensions.includes(ext)) {
          project.files[filePath] = content; // Data URL for media.
        } else {
          project.files[filePath] = content;
        }
        activeFolder = "";
        setActiveFile(filePath);
        updateSidebar();
        updateFileTabs();
        saveProject();
        e.target.value = "";
      };
      if (mediaExtensions.includes(file.name.split(".").pop().toLowerCase())) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    }
  });
  
  document.getElementById("download-file").addEventListener("click", function(){
    if(activeFile && project.files[activeFile]){
      const content = project.files[activeFile];
      const mime = getMimeType(activeFile);
      const blob = new Blob([content], {type: mime});
      const downloadLink = document.createElement("a");
      downloadLink.href = window.URL.createObjectURL(blob);
      const fname = activeFile.split("/").pop();
      downloadLink.download = fname;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
    else if(activeFolder) {
      const zip = new JSZip();
      const folderName = activeFolder;
      Object.keys(project.files).forEach(key => {
        if(key.startsWith(activeFolder + "/")){
          const relativePath = key.substring(activeFolder.length + 1);
          zip.file(relativePath, project.files[key]);
        }
      });
      zip.generateAsync({ type: "blob" }).then(function(content) {
        const downloadLink = document.createElement("a");
        downloadLink.href = window.URL.createObjectURL(content);
        downloadLink.download = folderName + ".zip";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      });
    }
    else {
      alert("No file or folder is selected for download.");
    }
  });
  
  // ---- Live Preview & Output Panel Tabs ----
  function assembleProject() {
    return project.files[activeFile];
  }
  
  document.getElementById("live-tab").addEventListener("click", function () {
    // Activate Live Preview.
    this.classList.add("active");
    document.getElementById("terminal-tab").classList.remove("active");
    document.getElementById("doc-tab").classList.remove("active");
    document.getElementById("live-content").classList.add("active");
    document.getElementById("terminal-content").classList.remove("active");
    document.getElementById("docs-content").classList.remove("active");
    
    const ext = activeFile.split(".").pop().toLowerCase();
    if (ext === "html" || ext === "htm") {
      let baseFolder = "";
      if (activeFile.includes("/")) {
        baseFolder = activeFile.substring(0, activeFile.lastIndexOf("/"));
      }
      const resolvedHTML = resolveRelativePaths(project.files[activeFile], baseFolder);
      document.getElementById("live-preview").srcdoc = resolvedHTML;
    } else if (ext === "css") {
      document.getElementById("live-preview").srcdoc = project.files[activeFile];
    } else if (ext === "js" || ext === "ts") {
      let outputCollector = [];
      const customConsole = {
        log: function(...args) {
          outputCollector.push(args.join(" "));
        }
      };
      try {
        const code = project.files[activeFile];
        const func = new Function("console", code);
        func(customConsole);
        document.getElementById("live-preview").srcdoc = `<pre>${outputCollector.join("\n")}</pre>`;
      } catch (e) {
        document.getElementById("live-preview").srcdoc = `<pre>Error: ${e.message}</pre>`;
      }
    } else if (ext === "py") {
      if (window.pyodide) {
        pyodide.runPythonAsync(project.files[activeFile]).then(output => {
          document.getElementById("live-preview").srcdoc = `<pre>${output}</pre>`;
        }).catch(err => {
          document.getElementById("live-preview").srcdoc = `<pre>Error: ${err.message}</pre>`;
        });
      } else {
        document.getElementById("live-preview").srcdoc = `<pre>Loading Pyodide... Please wait.</pre>`;
      }
    } else if (ext === "c") {
      document.getElementById("live-preview").srcdoc = `<pre>Live execution for C is not supported.</pre>`;
    } else if (mediaExtensions.includes(ext)) {
      let fileContent = project.files[activeFile];
      let srcUrl = fileContent;
      if (!srcUrl.startsWith("data:")) {
        const mime = getMimeType(activeFile);
        const blob = new Blob([fileContent], { type: mime });
        srcUrl = URL.createObjectURL(blob);
      }
      let mediaElement = "";
      if (["png", "jpg", "jpeg", "gif", "svg"].includes(ext)) {
        mediaElement = `<img src="${srcUrl}" alt="${activeFile}" />`;
      } else if (["mp4", "webm", "ogg"].includes(ext)) {
        mediaElement = `<video src="${srcUrl}" controls></video>`;
      } else if (["mp3", "wav", "aac"].includes(ext)) {
        mediaElement = `<audio src="${srcUrl}" controls></audio>`;
      } else {
        mediaElement = `<pre>${fileContent}</pre>`;
      }
      const htmlDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${activeFile}</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      width: 100%;
      background: var(--output-bg);
      display: flex;
      justify-content: center;
      align-items: center;
    }
    img, video, audio {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      display: block;
    }
    video, audio {
      background: #000;
    }
  </style>
</head>
<body>
  ${mediaElement}
</body>
</html>`;
      document.getElementById("live-preview").src = "data:text/html;base64," + btoa(htmlDoc);
    } else {
      document.getElementById("live-preview").srcdoc = project.files[activeFile];
    }
  });
  
  document.getElementById("terminal-tab").addEventListener("click", function () {
    this.classList.add("active");
    document.getElementById("live-tab").classList.remove("active");
    document.getElementById("doc-tab").classList.remove("active");
    document.getElementById("terminal-content").classList.add("active");
    document.getElementById("live-content").classList.remove("active");
    document.getElementById("docs-content").classList.remove("active");
  });
  
  document.getElementById("doc-tab").addEventListener("click", function () {
    this.classList.add("active");
    document.getElementById("live-tab").classList.remove("active");
    document.getElementById("terminal-tab").classList.remove("active");
    document.getElementById("docs-content").classList.add("active");
    document.getElementById("live-content").classList.remove("active");
    document.getElementById("terminal-content").classList.remove("active");
    updateDocumentation();
  });
  
  // ---- xterm.js Terminal Setup ----
  const terminalContainer = document.getElementById("terminal-container");
  let termInstance = new Terminal({
    cols: 80,
    rows: 20,
    theme: { background: "#000", foreground: "#fff" }
  });
  termInstance.open(terminalContainer);
  termInstance.write("Welcome to NebulaCode Terminal\r\n$ ");
  termInstance.onData((data) => {
    termInstance.write(data);
    if (data === "\r") {
      termInstance.write("\r\n$ ");
    }
  });
  
  // ---- Workspace Panel Toggle & Sidebar ----
  const workspaceEl = document.getElementById("workspace");
  const toggleEditor = document.getElementById("toggle-editor");
  const toggleOutput = document.getElementById("toggle-output");
  
  toggleEditor.addEventListener("click", function () {
    if (window.innerWidth <= 768) {
      if (workspaceEl.classList.contains("max-editor")) {
        workspaceEl.classList.remove("max-editor");
        workspaceEl.classList.add("max-output");
      } else {
        workspaceEl.classList.remove("max-output");
        workspaceEl.classList.add("max-editor");
      }
    } else {
      if (workspaceEl.classList.contains("max-editor") || workspaceEl.classList.contains("max-output")) {
        workspaceEl.classList.remove("max-editor", "max-output");
        workspaceEl.classList.add("split-view");
      } else if (workspaceEl.classList.contains("split-view")) {
        workspaceEl.classList.remove("split-view");
        workspaceEl.classList.add("max-editor");
      }
    }
  });
  
  toggleOutput.addEventListener("click", function () {
    if (window.innerWidth <= 768) {
      if (workspaceEl.classList.contains("max-output")) {
        workspaceEl.classList.remove("max-output");
        workspaceEl.classList.add("max-editor");
      }
    } else {
      if (workspaceEl.classList.contains("split-view")) {
        workspaceEl.classList.remove("split-view");
        workspaceEl.classList.add("max-output");
      } else if (workspaceEl.classList.contains("max-output")) {
        workspaceEl.classList.remove("max-output");
        workspaceEl.classList.add("split-view");
      }
    }
  });
  
  const hamburger = document.getElementById("hamburger");
  const sidebarEl = document.getElementById("sidebar");
  hamburger.addEventListener("click", function () {
    if (window.innerWidth <= 768) {
      sidebarEl.classList.toggle("visible");
    } else {
      sidebarEl.classList.toggle("collapsed");
    }
  });
  
  // ---- Block Page Zoom Events ----
  document.addEventListener("wheel", function (e) {
    if (e.ctrlKey) { e.preventDefault(); }
  }, { passive: false });
  document.addEventListener("touchmove", function (e) {
    if (e.touches.length > 1) { e.preventDefault(); }
  }, { passive: false });
  document.addEventListener("gesturestart", function (e) { e.preventDefault(); });
  document.addEventListener("gesturechange", function (e) { e.preventDefault(); });
  document.addEventListener("gestureend", function (e) { e.preventDefault(); });
  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=' || e.keyCode === 187 || e.keyCode === 189)) {
      e.preventDefault();
    }
  });
  
  // ---- Initialization ----
  loadProject();
  if (!currentFolder) { currentFolder = "Root Folder"; }
  if (openTabs.length === 0) { openTabs = Object.keys(project.files); }
  workspaceEl.classList.add("max-editor");
  setActiveFile("index.html");
  updateSidebar();
  updateFileTabs();
  console.log("NebulaCode is fully initialized and ready to go!");
  
  // ---- Load Pyodide for Python Execution ----
  loadPyodide().then(pyodide => {
    window.pyodide = pyodide;
    console.log("Pyodide loaded.");
  });
  
  // ---- Hide loading overlay after initialization ----
  loadingOverlay.style.opacity = "0";
  setTimeout(() => {
    loadingOverlay.style.display = "none";
  }, 500);
});
// ---- Debounce Utility ----
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}