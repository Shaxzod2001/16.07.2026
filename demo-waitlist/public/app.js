(function () {
  "use strict";

  var form = document.getElementById("signup-form");
  var emailInput = document.getElementById("email");
  var nameInput = document.getElementById("name");
  var emailError = document.getElementById("email-error");
  var submitBtn = document.getElementById("submit-btn");
  var btnLabel = submitBtn.querySelector(".btn-label");
  var counterValue = document.getElementById("counter-value");

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var RESET_DELAY_MS = 2000;

  function setEmailError(message) {
    if (message) {
      emailError.textContent = message;
      emailError.hidden = false;
      emailInput.classList.add("invalid");
      emailInput.setAttribute("aria-invalid", "true");
    } else {
      emailError.textContent = "";
      emailError.hidden = true;
      emailInput.classList.remove("invalid");
      emailInput.removeAttribute("aria-invalid");
    }
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    if (isLoading) {
      btnLabel.innerHTML = '<span class="spinner" role="status" aria-label="Submitting"></span>';
    }
  }

  function setSuccess() {
    submitBtn.classList.add("success");
    btnLabel.textContent = "You're in ✓";
  }

  function resetButton() {
    submitBtn.classList.remove("success");
    submitBtn.disabled = false;
    btnLabel.textContent = "Join the waitlist";
  }

  function updateCounter(count) {
    if (typeof count === "number" && !isNaN(count)) {
      counterValue.textContent = count.toLocaleString();
    }
  }

  function loadCount() {
    fetch("/api/count")
      .then(function (res) {
        if (!res.ok) {
          throw new Error("Failed to load count");
        }
        return res.json();
      })
      .then(function (data) {
        updateCounter(data.count);
      })
      .catch(function () {
        // Leave the placeholder in place if the count can't be fetched.
      });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var email = emailInput.value.trim();
    var name = nameInput.value.trim();

    setEmailError(null);

    if (!EMAIL_RE.test(email)) {
      setEmailError("Enter a valid email address.");
      emailInput.focus();
      return;
    }

    var payload = { email: email };
    if (name) {
      payload.name = name;
    }

    setLoading(true);

    fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { status: res.status, body: data };
        });
      })
      .then(function (result) {
        if (result.status === 201 && result.body && result.body.success) {
          setSuccess();
          updateCounter(result.body.position);
          setTimeout(function () {
            resetButton();
            form.reset();
            setEmailError(null);
          }, RESET_DELAY_MS);
        } else {
          var message =
            (result.body && result.body.error) || "Something went wrong. Please try again.";
          setEmailError(message);
          resetButton();
          emailInput.focus();
        }
      })
      .catch(function () {
        setEmailError("Network error. Please try again.");
        resetButton();
      });
  });

  emailInput.addEventListener("input", function () {
    if (!emailError.hidden) {
      setEmailError(null);
    }
  });

  loadCount();
})();
