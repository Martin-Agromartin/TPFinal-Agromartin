document.addEventListener("DOMContentLoaded", () => {
  const productSelect = document.getElementById("product-select");
  const quantityInput = document.getElementById("product-quantity");
  const addProductButton = document.getElementById("add-product");
  const orderSummaryBody = document.getElementById("order-summary-body");
  const orderTotal = document.getElementById("order-total");
  const itemsCount = document.getElementById("items-count");
  const orderForm = document.getElementById("order-form");
  const orderAlert = document.getElementById("order-alert");
  const orderPreview = document.getElementById("order-preview");

  const customerFields = [
    "customer-name",
    "customer-email",
    "customer-phone",
    "customer-city",
    "delivery-method",
    "desired-date"
  ];

  const orderItems = [];

  const formatCurrency = (value) =>
    value.toLocaleString("es-AR", { style: "currency", currency: "ARS" });

  const resetAlert = () => {
    orderAlert.classList.add("d-none");
    orderAlert.textContent = "";
    orderAlert.classList.remove("alert-success", "alert-danger", "alert-warning");
  };

  const showAlert = (message, type = "success") => {
    orderAlert.textContent = message;
    orderAlert.className = `alert alert-${type}`;
  };

  const updatePreview = () => {
    if (!orderItems.length) {
      orderPreview.textContent = "Aún no agregaste productos a tu pedido.";
      return;
    }

    const customerData = customerFields
      .map((fieldId) => {
        const field = document.getElementById(fieldId);
        if (!field || !field.value) return null;

        const label = field.closest(".col-sm-6, .col-md-6, .col-12, .mb-3")?.querySelector("label");
        return label ? `${label.textContent}: ${field.value}` : null;
      })
      .filter(Boolean)
      .join("\n");

    const itemsData = orderItems
      .map((item, index) => `${index + 1}. ${item.name} x${item.quantity} - ${formatCurrency(item.total)}`)
      .join("\n");

    const total = orderItems.reduce((acc, item) => acc + item.total, 0);

    orderPreview.textContent = [
      "Resumen del pedido CDI",
      customerData,
      "Detalle de productos:",
      itemsData,
      `Total estimado: ${formatCurrency(total)}`,
      "Un asesor comercial se comunicará para confirmar disponibilidad y coordinar la entrega."
    ]
      .filter(Boolean)
      .join("\n\n");
  };

  const renderTable = () => {
    if (!orderItems.length) {
      orderSummaryBody.innerHTML =
        '<tr><td colspan="4" class="text-center text-muted">Agregá productos para ver el detalle aquí.</td></tr>';
      itemsCount.textContent = "0 ítems";
      orderTotal.textContent = "$0";
      updatePreview();
      return;
    }

    const fragment = document.createDocumentFragment();
    let total = 0;
    let totalQuantity = 0;

    orderItems.forEach((item, index) => {
      total += item.total;
      totalQuantity += item.quantity;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>
          <span class="fw-semibold">${item.name}</span>
          <div class="text-muted small">${formatCurrency(item.price)} c/u</div>
        </td>
        <td class="text-center">${item.quantity}</td>
        <td class="text-end">${formatCurrency(item.total)}</td>
        <td class="text-center">
          <button type="button" class="btn btn-sm btn-outline-danger" data-index="${index}">
            Quitar
          </button>
        </td>
      `;
      fragment.appendChild(row);
    });

    orderSummaryBody.innerHTML = "";
    orderSummaryBody.appendChild(fragment);
    orderTotal.textContent = formatCurrency(total);
    itemsCount.textContent = `${totalQuantity} ${totalQuantity === 1 ? "ítem" : "ítems"}`;
    updatePreview();
  };

  const addProduct = () => {
    resetAlert();

    const selectedOption = productSelect.options[productSelect.selectedIndex];
    const quantity = Number.parseInt(quantityInput.value, 10);

    if (!selectedOption || !selectedOption.value) {
      showAlert("Por favor seleccioná un producto antes de agregarlo.", "warning");
      productSelect.focus();
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      showAlert("Ingresá una cantidad válida para continuar.", "warning");
      quantityInput.focus();
      return;
    }

    const price = Number.parseInt(selectedOption.dataset.price ?? "0", 10);
    const existingItem = orderItems.find((item) => item.id === selectedOption.value);

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.total = existingItem.quantity * existingItem.price;
    } else {
      orderItems.push({
        id: selectedOption.value,
        name: selectedOption.textContent,
        price,
        quantity,
        total: quantity * price
      });
    }

    quantityInput.value = "1";
    renderTable();
  };

  orderSummaryBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-index]");
    if (!button) return;

    const index = Number.parseInt(button.dataset.index, 10);
    orderItems.splice(index, 1);
    renderTable();
  });

  addProductButton.addEventListener("click", addProduct);

  orderForm.addEventListener("submit", (event) => {
    event.preventDefault();
    resetAlert();

    if (!orderItems.length) {
      showAlert("Tu pedido necesita al menos un producto para enviarse.", "danger");
      return;
    }

    const invalidField = customerFields
      .map((fieldId) => document.getElementById(fieldId))
      .find((field) => field && !field.value);

    if (invalidField) {
      showAlert("Completá todos los datos obligatorios marcados en el formulario.", "danger");
      invalidField.focus();
      return;
    }

    const orderData = {
      customer: {
        name: document.getElementById("customer-name").value,
        email: document.getElementById("customer-email").value,
        phone: document.getElementById("customer-phone").value,
        city: document.getElementById("customer-city").value
      },
      delivery: {
        method: document.getElementById("delivery-method").value,
        desiredDate: document.getElementById("desired-date").value,
        notes: document.getElementById("order-notes").value.trim()
      },
      items: orderItems.map((item) => ({ ...item }))
    };

    console.table(orderData.items);
    showAlert("¡Pedido enviado! Nos comunicaremos a la brevedad para coordinar los próximos pasos.");

    updatePreview();
    orderForm.reset();
    orderItems.length = 0;
    renderTable();
  });
});
