const STORE_LABELS = {
  lidl: "Lidl",
  plusfresc: "Plus Fresc",
  bonpreuesclat: "Bonpreu/Esclat",
};

const STORE_COLORS = {
  lidl: "#0050aa",
  plusfresc: "#e8720c",
  bonpreuesclat: "#d81324",
};

const SUGGESTIONS = ["Leche", "Huevos", "Pan", "Pollo", "Aceite de oliva", "Papel higiénico"];

const MATCH_THRESHOLD = 0.6;

// Mismo catálogo que usa el servidor en modo USE_MOCK_SCRAPERS=true
// (src/scrapers/mock.ts). Se usa aquí cuando la página se sirve sin backend
// (por ejemplo desde GitHub Pages), para que la comparación funcione igual
// con datos de muestra en vez de precios reales.
const MOCK_OFFERS = [
  { store: "lidl", productName: "Leche entera Pilgrim 1L", price: 0.89 },
  { store: "lidl", productName: "Papel higiénico Cien 24 rollos", price: 6.99 },
  { store: "lidl", productName: "Aceite de oliva virgen extra 1L", price: 4.49 },
  { store: "lidl", productName: "Pechuga de pollo 1kg", price: 5.5 },
  { store: "lidl", productName: "Huevos camperos docena", price: 2.29 },
  { store: "lidl", productName: "Pan de molde integral", price: 1.19 },
  { store: "plusfresc", productName: "Llet sencera Plus Fresc 1L", price: 0.82 },
  { store: "plusfresc", productName: "Paper higienic 24 rotlles", price: 6.5 },
  { store: "plusfresc", productName: "Pit de pollastre 1kg", price: 5.2 },
  { store: "plusfresc", productName: "Ous camperos dotzena", price: 2.15 },
  { store: "plusfresc", productName: "Detergent 40 rentats", price: 5.99 },
  { store: "bonpreuesclat", productName: "Llet sencera Bonpreu 1L", price: 0.85 },
  { store: "bonpreuesclat", productName: "Oli d'oliva verge extra 1L", price: 4.75 },
  { store: "bonpreuesclat", productName: "Paper higienic 24 rotlles", price: 6.79 },
  { store: "bonpreuesclat", productName: "Pa de motlle integral", price: 1.25 },
  { store: "bonpreuesclat", productName: "Detergent 40 rentats", price: 6.1 },
];

// ---------- Motor de datos local (localStorage + matching en el navegador) ----------
// Se usa solo cuando no se detecta un backend real (ver detectBackend más abajo).

const LOCAL_PRODUCTS_KEY = "boot-whatsapp:products";
const LOCAL_COUNTER_KEY = "boot-whatsapp:next-id";

function normalize(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function bigrams(text) {
  const clean = text.replace(/\s+/g, "");
  const result = [];
  for (let i = 0; i < clean.length - 1; i++) result.push(clean.slice(i, i + 2));
  return result;
}

function diceCoefficient(a, b) {
  if (a === b) return 1;
  const bigramsA = bigrams(a);
  const bigramsB = bigrams(b);
  if (bigramsA.length === 0 || bigramsB.length === 0) return 0;

  const counts = new Map();
  for (const bg of bigramsA) counts.set(bg, (counts.get(bg) ?? 0) + 1);

  let intersection = 0;
  for (const bg of bigramsB) {
    const count = counts.get(bg) ?? 0;
    if (count > 0) {
      intersection++;
      counts.set(bg, count - 1);
    }
  }
  return (2 * intersection) / (bigramsA.length + bigramsB.length);
}

function similarity(productName, offerName) {
  const a = normalize(productName);
  const b = normalize(offerName);
  if (!a || !b) return 0;

  const dice = diceCoefficient(a, b);
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
  const words = shorter.split(" ").filter(Boolean);
  const allWordsContained = words.length > 0 && words.every((word) => longer.includes(word));

  return allWordsContained ? Math.max(dice, 0.85) : dice;
}

function loadLocalProducts() {
  try {
    const raw = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalProducts(products) {
  try {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
  } catch {
    // almacenamiento no disponible (modo privado, etc.): la lista no persiste
  }
}

function nextLocalId() {
  const current = Number(localStorage.getItem(LOCAL_COUNTER_KEY) || "0") + 1;
  localStorage.setItem(LOCAL_COUNTER_KEY, String(current));
  return current;
}

function localListProducts() {
  return loadLocalProducts();
}

function localAddProduct(name) {
  const products = loadLocalProducts();
  const normalized_name = normalize(name);
  const exists = products.some((p) => p.normalized_name === normalized_name);
  if (!exists) {
    products.push({ id: nextLocalId(), name: name.trim(), normalized_name });
    saveLocalProducts(products);
  }
  return { added: !exists, products: loadLocalProducts() };
}

function localRemoveProduct(id) {
  const products = loadLocalProducts().filter((p) => p.id !== id);
  saveLocalProducts(products);
  return { products };
}

function localClearProducts() {
  saveLocalProducts([]);
  return { products: [] };
}

function localCompare() {
  const products = loadLocalProducts();

  const comparisons = products.map((product) => {
    const scored = MOCK_OFFERS.map((offer) => ({ offer, score: similarity(product.name, offer.productName) })).filter(
      (m) => m.score >= MATCH_THRESHOLD
    );

    const bestPerStore = new Map();
    for (const { offer, score } of scored) {
      const current = bestPerStore.get(offer.store);
      if (!current || offer.price < current.offer.price) {
        bestPerStore.set(offer.store, { offer, score });
      }
    }

    const matches = [...bestPerStore.values()]
      .sort((a, b) => a.offer.price - b.offer.price)
      .map(({ offer, score }) => ({
        store: offer.store,
        storeLabel: STORE_LABELS[offer.store],
        price: offer.price,
        offerName: offer.productName,
        score,
      }));

    return { product: { id: product.id, name: product.name }, matches };
  });

  return { scrapeResults: [], comparisons };
}

// ---------- Capa de API: usa el backend real si existe, si no el motor local ----------

let backendAvailable = null;

async function detectBackend() {
  if (backendAvailable !== null) return backendAvailable;
  try {
    const res = await fetch("api/products", { headers: { Accept: "application/json" } });
    const contentType = res.headers.get("content-type") || "";
    backendAvailable = res.ok && contentType.includes("application/json");
  } catch {
    backendAvailable = false;
  }
  return backendAvailable;
}

async function apiListProducts() {
  if (await detectBackend()) {
    const res = await fetch("api/products");
    return await res.json();
  }
  return localListProducts();
}

async function apiAddProduct(name) {
  if (await detectBackend()) {
    const res = await fetch("api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    return await res.json();
  }
  return localAddProduct(name);
}

async function apiRemoveProduct(id) {
  if (await detectBackend()) {
    const res = await fetch(`api/products/${id}`, { method: "DELETE" });
    return await res.json();
  }
  return localRemoveProduct(id);
}

async function apiClearProducts() {
  if (await detectBackend()) {
    const res = await fetch("api/products", { method: "DELETE" });
    return await res.json();
  }
  return localClearProducts();
}

async function apiCompare() {
  if (await detectBackend()) {
    const res = await fetch("api/compare", { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Error al comparar precios");
    }
    return await res.json();
  }
  // pequeña pausa para que el estado "Comparando..." se note, como con una petición real
  await new Promise((r) => setTimeout(r, 400));
  return localCompare();
}

// ---------- Interfaz ----------

const demoBannerEl = document.getElementById("demo-banner");
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
    if (existingNames.has(normalize(suggestion))) continue;

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
  const products = await apiListProducts();
  renderProducts(products);
  return products;
}

async function addProduct(name) {
  const data = await apiAddProduct(name);
  renderProducts(data.products);
  showToast(data.added ? `Añadido "${name}"` : `"${name}" ya estaba en la lista`);
}

async function removeProduct(id, name) {
  const data = await apiRemoveProduct(id);
  renderProducts(data.products);
  showToast(`Eliminado "${name}"`);
}

async function clearProducts() {
  if (!confirm("¿Vaciar toda la lista?")) return;
  const data = await apiClearProducts();
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
    const data = await apiCompare();
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

(async () => {
  const hasBackend = await detectBackend();
  demoBannerEl.hidden = hasBackend;
  await loadProducts();
})();
