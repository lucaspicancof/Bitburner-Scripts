export function createWindow(id, title) {

    const doc = eval("document");

    let container = doc.getElementById(id);

    if (container) {
        return container;
    }

    container = doc.createElement("div");

    container.id = id;

    container.style.position = "fixed";
    container.style.top = "100px";
    container.style.right = "20px";

    container.style.width = "700px";
    container.style.height = "500px";

    container.style.backgroundColor = "#111";
    container.style.color = "#fff";

    container.style.border = "1px solid #444";
    container.style.borderRadius = "8px";

    container.style.padding = "10px";

    container.style.zIndex = "999999";

    container.style.fontFamily = "monospace";

    container.innerHTML = `
        <h2>${title}</h2>
        <div id="${id}-content"></div>
    `;

    doc.body.appendChild(container);

    return container;
}

export function updateWindow(id, html) {

    const doc = eval("document");

    const content =
        doc.getElementById(`${id}-content`);

    if (content) {
        content.innerHTML = html;
    }
}

export function removeWindow(id) {

    const doc = eval("document");

    const container =
        doc.getElementById(id);

    if (container) {
        container.remove();
    }
}
