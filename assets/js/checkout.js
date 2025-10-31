// --- Kilimall-style Multi-Step Checkout ---

const SUPABASE_URL = "https://kokntkhxkymllafuubun.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtva250a2h4a3ltbGxhZnV1YnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NzYxODcsImV4cCI6MjA2ODM1MjE4N30.Ekc6HLszFSYTIgsvzTdKJWr85nFMUH2HQBQrg_uqXRc";
const PAYPAL_CLIENT_ID = "sb"; // Use your real client ID in production
const PAYPAL_BUSINESS_EMAIL = "maxxichorea@gmail.com";

const supabase = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : window.createClient
  ? window.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

let currentUser = null;
let cart = [];
let addresses = [];
let selectedAddressId = null;
let selectedDelivery = null;
let selectedPayment = null;
let shippingFee = 0;
let orderPlaced = false;
let shippingCalcDetails = { city: "", country: "", postal: "" };

const deliveryMethods = [
  { id: "standard", name: "Standard Shipping", fee: 5.0, eta: "3-7 days" },
  { id: "express", name: "Express Shipping", fee: 10.0, eta: "1-3 days" },
  { id: "pickup", name: "Premium Express Delivery", fee: 23.0, eta: "Same Day" },
];

const steps = [
  { id: 1, name: "Address" },
  { id: 2, name: "Delivery" },
  { id: 3, name: "Payment" },
  { id: 4, name: "Review" },
];
let currentStep = 1;

function getCartKey() {
  return currentUser ? `cart_user_${currentUser.id}` : "cart_guest";
}

function loadCart() {
  const localCart = localStorage.getItem(getCartKey());
  cart = localCart ? JSON.parse(localCart) : [];
}

function renderOrderSummary() {
  const itemsDiv = document.getElementById("order-items");
  const totalDiv = document.getElementById("order-total");
  const shippingDiv = document.getElementById("order-shipping");
  if (!itemsDiv || !totalDiv || !shippingDiv) return;
  if (!cart.length) {
    itemsDiv.innerHTML = '<div style="color:#ccc">Your cart is empty.</div>';
    shippingDiv.innerHTML = "";
    totalDiv.innerHTML = "";
    return;
  }
  let subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  // Product cards
  itemsDiv.innerHTML = cart
    .map(
      (item) => `
        <div class="order-item" style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          <img src="${
            item.image || "../assets/images/products/default.jpg"
          }" alt="${
        item.name
      }" style="width:48px;height:48px;object-fit:cover;border-radius:8px;border:1px solid #333;" />
          <div style="flex:1;">
            <div style="font-weight:600;">${item.name}</div>
            <div style="color:#888;font-size:0.95em;">$${item.price.toFixed(
              2
            )} x ${item.quantity}</div>
          </div>
          <div style="font-weight:700;color:#25d366;">$${(
            item.price * item.quantity
          ).toFixed(2)}</div>
        </div>
      `
    )
    .join("");
  // Shipping fee
  shippingDiv.innerHTML = shippingFee
    ? `<span>Shipping</span><span>$${shippingFee.toFixed(2)}</span>`
    : "";
  totalDiv.innerHTML = `<span>Total</span><span>$${(
    subtotal + shippingFee
  ).toFixed(2)}</span>`;
}

// --- Stepper UI ---
function renderStepper() {
  const stepper = document.getElementById("stepper");
  if (!stepper) return;
  stepper.querySelectorAll(".step").forEach((el, idx) => {
    el.classList.remove("active", "completed");
    if (idx + 1 < currentStep) el.classList.add("completed");
    else if (idx + 1 === currentStep) el.classList.add("active");
  });
}

function goToStep(step) {
  currentStep = step;
  renderStepper();
  renderStepContent();
  renderStepButtons();
}

function nextStep() {
  if (currentStep < steps.length) goToStep(currentStep + 1);
}
function prevStep() {
  if (currentStep > 1) goToStep(currentStep - 1);
}

// --- Address Book ---
async function fetchAddresses() {
  if (!supabase || !currentUser) return [];
  const { data, error } = await supabase
    .from("profile")
    .select("*")
    .eq("id", currentUser.id);
  if (data && data.length) {
    addresses = [data[0]]; // For now, single address per user
    selectedAddressId = data[0].id;
  } else {
    addresses = [];
    selectedAddressId = null;
  }
}

function renderAddressStep() {
  const container = document.getElementById("step-content");
  if (!container) return;
  let address = addresses[0] || {};
  container.innerHTML = `
    <h2>Shipping Address</h2>
    <form id="address-form">
      <div id="address-error" style="color:#ff4757;margin-bottom:10px;display:none;"></div>
      <div class="form-group" style="margin-bottom:18px;">
        <label for="fullName" style="font-weight:600;color:#25d366;margin-bottom:6px;display:block;">Full Name</label>
        <input type="text" id="fullName" name="fullName" value="${
          address.full_name || ""
        }" required style="width:100%;padding:12px 14px;background:#23272b;border:1.5px solid #333;border-radius:8px;color:#fff;font-size:1rem;outline:none;transition:border 0.2s;" />
      </div>
      <div class="form-group" style="margin-bottom:18px;">
        <label for="email" style="font-weight:600;color:#25d366;margin-bottom:6px;display:block;">Email</label>
        <input type="email" id="email" name="email" value="${
          address.email || ""
        }" required style="width:100%;padding:12px 14px;background:#23272b;border:1.5px solid #333;border-radius:8px;color:#fff;font-size:1rem;outline:none;transition:border 0.2s;" />
      </div>
      <div class="form-group" style="margin-bottom:18px;">
        <label for="phone" style="font-weight:600;color:#25d366;margin-bottom:6px;display:block;">Phone Number</label>
        <input type="tel" id="phone" name="phone" value="${
          address.phone || ""
        }" required style="width:100%;padding:12px 14px;background:#23272b;border:1.5px solid #333;border-radius:8px;color:#fff;font-size:1rem;outline:none;transition:border 0.2s;" />
      </div>
      <div class="form-group" style="margin-bottom:18px;">
        <label for="address" style="font-weight:600;color:#25d366;margin-bottom:6px;display:block;">Address</label>
        <input type="text" id="address" name="address" value="${
          address.address || ""
        }" required style="width:100%;padding:12px 14px;background:#23272b;border:1.5px solid #333;border-radius:8px;color:#fff;font-size:1rem;outline:none;transition:border 0.2s;" />
      </div>
      <div class="form-group" style="margin-bottom:18px;">
        <label for="city" style="font-weight:600;color:#25d366;margin-bottom:6px;display:block;">City</label>
        <input type="text" id="city" name="city" value="${
          address.city || ""
        }" required style="width:100%;padding:12px 14px;background:#23272b;border:1.5px solid #333;border-radius:8px;color:#fff;font-size:1rem;outline:none;transition:border 0.2s;" />
      </div>
      <div class="form-group" style="margin-bottom:18px;">
        <label for="state" style="font-weight:600;color:#25d366;margin-bottom:6px;display:block;">State/Province</label>
        <input type="text" id="state" name="state" value="${
          address.state || ""
        }" required style="width:100%;padding:12px 14px;background:#23272b;border:1.5px solid #333;border-radius:8px;color:#fff;font-size:1rem;outline:none;transition:border 0.2s;" />
      </div>
      <div class="form-group" style="margin-bottom:18px;">
        <label for="country" style="font-weight:600;color:#25d366;margin-bottom:6px;display:block;">Country</label>
        <input type="text" id="country" name="country" value="${
          address.country || ""
        }" required style="width:100%;padding:12px 14px;background:#23272b;border:1.5px solid #333;border-radius:8px;color:#fff;font-size:1rem;outline:none;transition:border 0.2s;" />
      </div>
      <div class="form-group" style="margin-bottom:18px;">
        <label for="postalCode" style="font-weight:600;color:#25d366;margin-bottom:6px;display:block;">Postal Code</label>
        <input type="text" id="postalCode" name="postalCode" value="${
          address.postal_code || ""
        }" required style="width:100%;padding:12px 14px;background:#23272b;border:1.5px solid #333;border-radius:8px;color:#fff;font-size:1rem;outline:none;transition:border 0.2s;" />
      </div>
      <div class="form-group" style="margin-bottom:18px;">
        <label for="instructions" style="font-weight:600;color:#25d366;margin-bottom:6px;display:block;">Delivery Instructions</label>
        <textarea id="instructions" name="instructions" style="width:100%;padding:12px 14px;background:#23272b;border:1.5px solid #333;border-radius:8px;color:#fff;font-size:1rem;outline:none;transition:border 0.2s;min-height:60px;resize:vertical;">${
          address.instructions || ""
        }</textarea>
      </div>
      <button type="submit" class="step-btn" style="width:100%;margin-top:10px;">Save & Continue</button>
    </form>
  `;
  document.getElementById("address-form").onsubmit = async function (e) {
    e.preventDefault();
    const form = e.target;
    const errorDiv = document.getElementById("address-error");
    errorDiv.style.display = "none";
    errorDiv.textContent = "";
    // Validate all fields
    const requiredFields = [
      "fullName",
      "email",
      "phone",
      "address",
      "city",
      "state",
      "country",
      "postalCode",
    ];
    let missing = [];
    requiredFields.forEach((f) => {
      if (!form[f].value.trim()) missing.push(f);
    });
    if (missing.length > 0) {
      errorDiv.textContent = "Please fill in all required fields.";
      errorDiv.style.display = "block";
      // Optionally highlight missing fields
      requiredFields.forEach((f) => {
        form[f].style.borderColor = missing.includes(f) ? "#ff4757" : "#333";
      });
      return;
    } else {
      requiredFields.forEach((f) => {
        form[f].style.borderColor = "#333";
      });
    }
    const formData = {
      id: currentUser.id,
      full_name: form.fullName.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      address: form.address.value.trim(),
      city: form.city.value.trim(),
      state: form.state.value.trim(),
      country: form.country.value.trim(),
      postal_code: form.postalCode.value.trim(),
      instructions: form.instructions.value.trim(),
      updated_at: new Date().toISOString(),
    };
    shippingCalcDetails.city = form.city.value.trim();
    shippingCalcDetails.country = form.country.value.trim();
    shippingCalcDetails.postal = form.postalCode.value.trim();
    await supabase.from("profile").upsert(formData, { onConflict: "id" });
    await fetchAddresses();
    nextStep();
  };
}

function renderDeliveryStep() {
  const container = document.getElementById("step-content");
  if (!container) return;
  container.innerHTML = `
    <h2>Delivery Method</h2>
    <form id="delivery-form">
      <div id="delivery-error" style="color:#ff4757;margin-bottom:10px;display:none;"></div>
      ${deliveryMethods
        .map(
          (d) => `
        <div style="margin-bottom:16px;display:flex;align-items:center;">
          <input type="radio" id="delivery-${d.id}" name="delivery" value="${
            d.id
          }" ${
            selectedDelivery === d.id ? "checked" : ""
          } required style="accent-color:#25d366;width:20px;height:20px;margin-right:12px;" />
          <label for="delivery-${
            d.id
          }" style="background:#23272b;border:1.5px solid #333;border-radius:8px;padding:14px 18px;flex:1;cursor:pointer;transition:border 0.2s;font-weight:600;color:#fff;display:flex;justify-content:space-between;align-items:center;">
            <span><strong>${
              d.name
            }</strong> <span style="color:#fbbf24;font-weight:400;font-size:0.98em;">(${
            d.eta
          })</span></span>
            <span style="color:#25d366;font-weight:700;">$${d.fee.toFixed(
              2
            )}</span>
          </label>
        </div>
      `
        )
        .join("")}
      <div class="form-group" style="margin-top:18px;margin-bottom:18px;">
        <label for="shipping-city" style="font-weight:600;color:#25d366;margin-bottom:6px;display:block;">Shipping City</label>
        <input type="text" id="shipping-city" name="shipping-city" value="${
          shippingCalcDetails.city || ""
        }" required style="width:100%;padding:12px 14px;background:#23272b;border:1.5px solid #333;border-radius:8px;color:#fff;font-size:1rem;outline:none;transition:border 0.2s;" />
      </div>
      <div class="form-group" style="margin-bottom:18px;">
        <label for="shipping-country" style="font-weight:600;color:#25d366;margin-bottom:6px;display:block;">Shipping Country</label>
        <input type="text" id="shipping-country" name="shipping-country" value="${
          shippingCalcDetails.country || ""
        }" required style="width:100%;padding:12px 14px;background:#23272b;border:1.5px solid #333;border-radius:8px;color:#fff;font-size:1rem;outline:none;transition:border 0.2s;" />
      </div>
      <div class="form-group" style="margin-bottom:18px;">
        <label for="shipping-postal" style="font-weight:600;color:#25d366;margin-bottom:6px;display:block;">Postal Code</label>
        <input type="text" id="shipping-postal" name="shipping-postal" value="${
          shippingCalcDetails.postal || ""
        }" required style="width:100%;padding:12px 14px;background:#23272b;border:1.5px solid #333;border-radius:8px;color:#fff;font-size:1rem;outline:none;transition:border 0.2s;" />
      </div>
      <button type="submit" class="step-btn" style="width:100%;margin-top:10px;">Calculate & Continue</button>
    </form>
  `;
  document.getElementById("delivery-form").onsubmit = function (e) {
    e.preventDefault();
    const form = e.target;
    const errorDiv = document.getElementById("delivery-error");
    errorDiv.style.display = "none";
    errorDiv.textContent = "";
    // Validate delivery method and shipping fields
    let missing = [];
    if (!form.delivery.value) missing.push("delivery");
    if (!form["shipping-city"].value.trim()) missing.push("city");
    if (!form["shipping-country"].value.trim()) missing.push("country");
    if (!form["shipping-postal"].value.trim()) missing.push("postal");
    if (missing.length > 0) {
      errorDiv.textContent =
        "Please select a delivery method and fill in all shipping fields.";
      errorDiv.style.display = "block";
      form["shipping-city"].style.borderColor = missing.includes("city")
        ? "#ff4757"
        : "#333";
      form["shipping-country"].style.borderColor = missing.includes("country")
        ? "#ff4757"
        : "#333";
      form["shipping-postal"].style.borderColor = missing.includes("postal")
        ? "#ff4757"
        : "#333";
      return;
    } else {
      form["shipping-city"].style.borderColor = "#333";
      form["shipping-country"].style.borderColor = "#333";
      form["shipping-postal"].style.borderColor = "#333";
    }
    selectedDelivery = form.delivery.value;
    shippingCalcDetails.city = form["shipping-city"].value.trim();
    shippingCalcDetails.country = form["shipping-country"].value.trim();
    shippingCalcDetails.postal = form["shipping-postal"].value.trim();
    // Shipping calculator logic
    const method = deliveryMethods.find((d) => d.id === selectedDelivery);
    if (!method) return;
    
    // Calculate subtotal for free shipping check
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    
    // Free shipping for orders over $200
    if (subtotal >= 200) {
      shippingFee = 0;
    } else {
      // Simple rule: if country is not 'Kenya', add $1 per item (international)
      const isInternational =
        shippingCalcDetails.country.toLowerCase() !== "kenya";
      const perItemFee = isInternational
        ? 1 * cart.reduce((sum, item) => sum + item.quantity, 0)
        : 0;
      shippingFee = method.fee + perItemFee;
    }
    renderOrderSummary();
    nextStep();
  };
}

function renderPaymentStep() {
  const container = document.getElementById("step-content");
  if (!container) return;
  container.innerHTML = `
    <h2>Payment Method</h2>
    <div id="paypal-button-container" style="margin:24px 0;"></div>
    <div style="color:#ccc;font-size:0.95rem;">Pay securely with PayPal. You will be redirected to PayPal to complete your payment.</div>
  `;
  // PayPal button will be rendered by JS after step navigation
  setTimeout(renderPayPalButton, 100);
}

function renderReviewStep() {
  const container = document.getElementById("step-content");
  if (!container) return;
  let address = addresses[0] || {};
  let method = deliveryMethods.find((d) => d.id === selectedDelivery) || {};
  let subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  container.innerHTML = `
    <h2>Review & Confirm</h2>
    <div style="margin-bottom:18px;">
      <strong>Shipping to:</strong><br/>
      ${address.full_name || ""}, ${address.address || ""}, ${
    address.city || ""
  }, ${address.state || ""}, ${address.country || ""}, ${
    address.postal_code || ""
  }<br/>
      <span style="color:#888;">${address.phone || ""} | ${
    address.email || ""
  }</span>
    </div>
    <div style="margin-bottom:18px;">
      <strong>Delivery:</strong> ${method.name || ""} (${method.eta || ""})<br/>
      <strong>Shipping Fee:</strong> $${shippingFee.toFixed(2)}
    </div>
    <div style="margin-bottom:18px;">
      <strong>Order Total:</strong> $${(subtotal + shippingFee).toFixed(2)}
    </div>
    <button class="step-btn" id="confirm-order-btn">Place Order</button>
  `;
  document.getElementById("confirm-order-btn").onclick = async function () {
    // This will be replaced by PayPal payment confirmation logic
    showConfirmation(
      "Please complete payment via PayPal to place your order.",
      true
    );
  };
}

function renderStepContent() {
  switch (currentStep) {
    case 1:
      renderAddressStep();
      break;
    case 2:
      renderDeliveryStep();
      break;
    case 3:
      renderPaymentStep();
      break;
    case 4:
      renderReviewStep();
      break;
  }
}

function renderStepButtons() {
  const btns = document.getElementById("step-buttons");
  if (!btns) return;
  btns.innerHTML = "";
  if (currentStep > 1 && currentStep <= steps.length) {
    btns.innerHTML += `<button class="step-btn" onclick="prevStep()">Back</button>`;
  }
  // Next button is handled in forms for steps 1/2, and PayPal for step 3
}

function showConfirmation(message, isError = false) {
  const msgDiv = document.getElementById("confirmation-message");
  msgDiv.textContent = message;
  msgDiv.style.display = "block";
  msgDiv.style.color = isError ? "#ff4757" : "#25d366";
}

// --- PayPal Integration (Stub for now) ---
function renderPayPalButton() {
  const container = document.getElementById("paypal-button-container");
  if (!container || orderPlaced) return;
  if (typeof paypal === "undefined") {
    container.innerHTML =
      "<div style='color:#ff4757'>PayPal SDK not loaded.</div>";
    return;
  }
  paypal
    .Buttons({
      createOrder: function (data, actions) {
        let subtotal = cart.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        return actions.order.create({
          purchase_units: [
            {
              amount: {
                value: (subtotal + shippingFee).toFixed(2),
                currency_code: "USD",
              },
              payee: { email_address: PAYPAL_BUSINESS_EMAIL },
              description: "MobileGaming Order",
            },
          ],
        });
      },
      onApprove: function (data, actions) {
        return actions.order.capture().then(function (details) {
          // Place order in Supabase after payment
          placeOrderAfterPayment(details);
        });
      },
      onError: function (err) {
        showConfirmation("PayPal error: " + err, true);
      },
    })
    .render("#paypal-button-container");
}

async function placeOrderAfterPayment(paypalDetails) {
  if (!supabase || !currentUser)
    return showConfirmation("Not logged in.", true);
  if (!cart.length) return showConfirmation("Cart is empty.", true);
  let address = addresses[0] || {};
  let method = deliveryMethods.find((d) => d.id === selectedDelivery) || {};
  let subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  // Read affiliate attribution captured globally
  const aff = typeof window.__getAffiliateAttribution === 'function' 
    ? window.__getAffiliateAttribution() 
    : { affiliate_id: '', utm_source: '', utm_campaign: '', utm_medium: '' };
  const order = {
    user_id: currentUser.id,
    items: cart,
    total: subtotal + shippingFee,
    shipping: {
      ...address,
      delivery_method: method.name,
      shipping_fee: shippingFee,
    },
    payment: {
      method: "PayPal",
      paypal_id: paypalDetails.id,
      payer_email: paypalDetails.payer.email_address,
      status: paypalDetails.status,
    },
    attribution: {
      affiliate_id: aff.affiliate_id || null,
      utm_source: aff.utm_source || null,
      utm_campaign: aff.utm_campaign || null,
      utm_medium: aff.utm_medium || null
    },
    status: "paid",
    created_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("orders").insert([order]);
  if (error) {
    showConfirmation("Order failed: " + error.message, true);
    return;
  }
  orderPlaced = true;
  showConfirmation("Thank you! Your order has been placed and paid.");
  clearCart();
  renderOrderSummary();
}

function clearCart() {
  localStorage.removeItem(getCartKey());
  cart = [];
}

// --- INIT ---
document.addEventListener("DOMContentLoaded", async function () {
  let user = null;
  if (supabase) {
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    if (u) user = u;
  }
  if (!user) {
    // Use previous guest login enforcement logic
    if (typeof showLoginPrompt === "function") {
      showLoginPrompt();
    } else {
      alert("Please log in to proceed to checkout.");
    }
    return;
  }
  currentUser = user;
  loadCart();
  renderOrderSummary();
  await fetchAddresses();
  renderStepper();
  renderStepContent();
  renderStepButtons();
  window.prevStep = prevStep;
  window.nextStep = nextStep;
});
