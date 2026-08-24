const productListEl = document.getElementById("product-list");
const emptyMessageEl = document.getElementById("empty-message");
const addFormEl = document.getElementById("add-form");
const productInputEl = document.getElementById("product-input");
const compareButtonEl = document.getElementById("compare-button");
const clearButtonEl = document.getElementById("clear-button");
const comparisonEl = document.getElementById("comparison");
const comparisonResultsEl = document.getElementById("comparison-results");
const statusEl = document.getElementById("status-message");

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function renderProducts(products) {
  productListEl.innerHTML = "";
  emptyMessageEl.hidden = products.length > 0;

  for (const product of products) {
    const li = document.createElement("li");

    const name = document.createElement("span");
    name.textContent = product.name;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "✕";
    removeButton.setAttribute("aria-label", `Quitar ${product.name}`);
    removeButton.addEventListener("click", () => removeProduct(product.id));

    li.append(name, removeButton);
    productListEl.append(li);
  }
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
        const label = document.createElement("span");
        label.textContent = `${index === 0 ? "🏆 " : ""}${match.storeLabel} — ${match.offerName}`;
        const price = document.createElement("span");
        price.textContent = formatPrice(match.price);
        row.append(label, price);
        item.append(row);
      });
    }

    comparisonResultsEl.append(item);
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
  setStatus(data.added ? `Añadido "${name}"` : `"${name}" ya estaba en la lista`);
}

async function removeProduct(id) {
  const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
  const data = await res.json();
  renderProducts(data.products);
  setStatus("Producto eliminado");
}

async function clearProducts() {
  if (!confirm("¿Vaciar toda la lista?")) return;
  const res = await fetch("/api/products", { method: "DELETE" });
  const data = await res.json();
  renderProducts(data.products);
  comparisonEl.hidden = true;
  setStatus("Lista vaciada");
}

async function compare() {
  const products = await loadProducts();
  if (products.length === 0) {
    setStatus("Añade productos a la lista antes de comparar");
    return;
  }

  compareButtonEl.disabled = true;
  setStatus("Comprobando ofertas en Lidl, Aldi, Plus Fresc y Esclat...");

  try {
    const res = await fetch("/api/compare", { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Error al comparar precios");
    }
    const data = await res.json();
    renderComparison(data.comparisons);
    setStatus("Comparativa actualizada");
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    compareButtonEl.disabled = false;
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
