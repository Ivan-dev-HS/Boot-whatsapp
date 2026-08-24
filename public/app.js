const STORE_COLORS = {
  lidl: "#0050aa",
  aldi: "#00447c",
  plusfresc: "#e8720c",
  esclat: "#d81324",
};

const SUGGESTIONS = ["Leche", "Huevos", "Pan", "Pollo", "Aceite de oliva", "Papel higiénico"];

const productListEl = document.getElementById("product-list");
const productCountEl = document.getElementById("product-count");
const emptyStateEl = document.getElementById("empty-state");
const addFormEl = document.getElementById("add-form");
const productInputEl = document.getElementById("product-input");
const suggestionsEl = document.getElementById("suggestions");
const compareButtonEl = document.getElementById("compare-button");
const clearButtonEl = document.getElementById("clear-button");
const comparisonEl = document.getElementById("comparison");
const comparisonResultsEl = document.getElementById("comparison-results");
const toastEl = document.getElementById("toast");

let toastTimer = null;

function showToast(message, isError = false) {
  toastEl.textContent = message;
  toastEl.classList.toggle("error", isError);
  toastEl.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("visible"), 2600);
}

function renderSuggestions(products) {
  const existingNames = new Set(products.map((p) => p.normalized_name));
  suggestionsEl.innerHTML = "";

  for (const suggestion of SUGGESTIONS) {
    const normalized = suggestion
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
    if (existingNames.has(normalized)) continue;

    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "suggestion-chip";
    chip.textContent = `+ ${suggestion}`;
    chip.addEventListener("click", () => addProduct(suggestion));
    suggestionsEl.append(chip);
  }
}

function renderProducts(products) {
  productListEl.innerHTML = "";
  productCountEl.textContent = products.length;
  emptyStateEl.style.display = products.length === 0 ? "flex" : "none";

  for (const product of products) {
    const li = document.createElement("li");

    const bullet = document.createElement("span");
    bullet.className = "bullet";

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = product.name;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "✕";
    removeButton.setAttribute("aria-label", `Quitar ${product.name}`);
    removeButton.addEventListener("click", () => removeProduct(product.id, product.name));

    li.append(bullet, name, removeButton);
    productListEl.append(li);
  }

  renderSuggestions(products);
}

function formatPrice(price) {
  return `${price.toFixed(2).replace(".", ",")} €`;
}

function renderComparison(comparisons) {
  comparisonResultsEl.innerHTML = "";
  comparisonEl.hidden = comparisons.length === 0;

  for (const { product, matches } of comparisons) {
    const item = document.createElement("div");
    item.className = "comparison-item";

    const title = document.createElement("h3");
    title.textContent = product.name;
    item.append(title);

    if (matches.length === 0) {
      const noOffers = document.createElement("p");
      noOffers.className = "no-offers";
      noOffers.textContent = "Sin ofertas encontradas ahora mismo.";
      item.append(noOffers);
    } else {
      matches.forEach((match, index) => {
        const row = document.createElement("div");
        row.className = "offer-row" + (index === 0 ? " best" : "");

        const dot = document.createElement("span");
        dot.className = "dot";
        dot.style.background = STORE_COLORS[match.store] || "#999";

        const storeName = document.createElement("span");
        storeName.className = "store-name";
        storeName.textContent = match.storeLabel;

        const offerName = document.createElement("span");
        offerName.className = "offer-name";
        offerName.textContent = match.offerName;

        const price = document.createElement("span");
        price.className = "price";
        price.textContent = formatPrice(match.price);

        row.append(dot, storeName, offerName, price);
        item.append(row);
      });
    }

    comparisonResultsEl.append(item);
  }

  if (comparisons.length > 0) {
    comparisonEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

async function loadProducts() {
  const res = await fetch("/api/products");
  const products = await res.json();
  renderProducts(products);
  return products;
}

async function addProduct(name) {
  const res = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  renderProducts(data.products);
  showToast(data.added ? `Añadido "${name}"` : `"${name}" ya estaba en la lista`);
}

async function removeProduct(id, name) {
  const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
  const data = await res.json();
  renderProducts(data.products);
  showToast(`Eliminado "${name}"`);
}

async function clearProducts() {
  if (!confirm("¿Vaciar toda la lista?")) return;
  const res = await fetch("/api/products", { method: "DELETE" });
  const data = await res.json();
  renderProducts(data.products);
  comparisonEl.hidden = true;
  showToast("Lista vaciada");
}

function setComparing(isComparing) {
  compareButtonEl.disabled = isComparing;
  compareButtonEl.querySelector(".button__label").textContent = isComparing
    ? "Comparando..."
    : "Comparar precios";
  compareButtonEl.querySelector(".button__spinner").hidden = !isComparing;
}

async function compare() {
  const products = await loadProducts();
  if (products.length === 0) {
    showToast("Añade productos a la lista antes de comparar");
    return;
  }

  setComparing(true);

  try {
    const res = await fetch("/api/compare", { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Error al comparar precios");
    }
    const data = await res.json();
    renderComparison(data.comparisons);
    showToast("Comparativa actualizada");
  } catch (error) {
    showToast(error.message, true);
  } finally {
    setComparing(false);
  }
}

addFormEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = productInputEl.value.trim();
  if (!name) return;
  productInputEl.value = "";
  await addProduct(name);
});

compareButtonEl.addEventListener("click", compare);
clearButtonEl.addEventListener("click", clearProducts);

loadProducts();
