document.addEventListener("DOMContentLoaded", async () => {
	// 1. Theme Toggling Logic
	const themeToggleBtn = document.getElementById("theme-toggle");
	const themeIcon = themeToggleBtn.querySelector("i");
	const htmlElement = document.documentElement;

	// Check system preference and local storage
	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
	const savedTheme = localStorage.getItem("theme");

	// Set initial theme
	if (savedTheme) {
		setTheme(savedTheme);
	} else if (prefersDark) {
		setTheme("dark");
	} else {
		setTheme("light");
	}

	function setTheme(theme) {
		htmlElement.setAttribute("data-theme", theme);
		localStorage.setItem("theme", theme);

		if (theme === "dark") {
			themeIcon.classList.remove("ph-moon");
			themeIcon.classList.add("ph-sun");
		} else {
			themeIcon.classList.remove("ph-sun");
			themeIcon.classList.add("ph-moon");
		}
	}

	themeToggleBtn.addEventListener("click", () => {
		const currentTheme = htmlElement.getAttribute("data-theme");
		const newTheme = currentTheme === "dark" ? "light" : "dark";
		setTheme(newTheme);
	});

	// 2. Load Configuration
	let config = { whatsappNumber: "", fields: [] };
	try {
		const response = await fetch("config.json");
		if (response.ok) {
			config = await response.json();
		} else {
			console.error("Failed to load config.json");
		}
	} catch (e) {
		console.error(
			"Error fetching config.json (might be CORS if running via file://)",
			e,
		);
		alert(
			"حدث خطأ أثناء تحميل الإعدادات. الرجاء التأكد من تشغيل الموقع عبر خادم محلي (Local Server).",
		);
		return; // Stop execution if config can't be loaded
	}
	const formConfig = config.fields;

	// 3. Form Generation Logic
	const formContainer = document.getElementById("form-fields-container");

	formConfig.forEach((field) => {
		if (field.type === "section") {
			const sectionTitle = document.createElement("h3");
			sectionTitle.className = "section-title";
			sectionTitle.textContent = field.label;
			formContainer.appendChild(sectionTitle);
			return;
		}

		const groupDiv = document.createElement("div");
		groupDiv.className = "form-group";
		if (field.halfWidth) {
			groupDiv.classList.add("half-width");
		} else {
			groupDiv.classList.add("full-width");
		}

		// Handle Checkbox
		if (field.type === "checkbox") {
			groupDiv.classList.add("checkbox-group");

			const input = document.createElement("input");
			input.type = "checkbox";
			input.id = field.id;
			input.name = field.id;
			if (field.required) input.required = true;

			const label = document.createElement("label");
			label.htmlFor = field.id;
			label.textContent = field.label;

			groupDiv.appendChild(input);
			groupDiv.appendChild(label);
		} else {
			// Handle other fields (text, select, textarea)
			const label = document.createElement("label");
			label.htmlFor = field.id;
			label.textContent = field.label;
			if (field.required) label.textContent += " *";
			groupDiv.appendChild(label);

			if (field.type === "select") {
				const select = document.createElement("select");
				select.id = field.id;
				select.name = field.id;
				select.className = "form-control";
				if (field.required) select.required = true;

				field.options.forEach((opt) => {
					const option = document.createElement("option");
					option.value = opt.value;
					option.textContent = opt.label;
					if (opt.value === "") {
						option.disabled = true;
						option.selected = true;
					}
					select.appendChild(option);
				});
				groupDiv.appendChild(select);
			} else if (field.type === "textarea") {
				const textarea = document.createElement("textarea");
				textarea.id = field.id;
				textarea.name = field.id;
				textarea.className = "form-control";
				textarea.placeholder = field.placeholder || "";
				if (field.required) textarea.required = true;
				groupDiv.appendChild(textarea);
			} else if (field.type === "date") {
				const input = document.createElement("input");
				input.type = "text"; // Start as text to hide placeholder
				input.id = field.id;
				input.name = field.id;
				input.className = "form-control";
				if (field.required) input.required = true;

				input.addEventListener("focus", function () {
					this.type = "date";
					if (this.showPicker) this.showPicker();
				});
				input.addEventListener("blur", function () {
					if (!this.value) this.type = "text";
				});

				groupDiv.appendChild(input);
			} else {
				const input = document.createElement("input");
				input.type = field.type;
				input.id = field.id;
				input.name = field.id;
				input.className = "form-control";
				input.placeholder = field.placeholder || "";
				if (field.required) input.required = true;
				groupDiv.appendChild(input);
			}
		}

		// Add error message span for required fields
		if (field.required) {
			const errorSpan = document.createElement("span");
			errorSpan.className = "error-text";
			errorSpan.id = `error-${field.id}`;
			errorSpan.textContent = "يرجى تعبئة هذا الحقل";
			groupDiv.appendChild(errorSpan);
		}

		formContainer.appendChild(groupDiv);
	});

	// 4. WhatsApp Redirection Logic
	const whatsappForm = document.getElementById("whatsapp-form");
	const WHATSAPP_NUMBER = config.whatsappNumber;

	// Clear errors on input
	whatsappForm.addEventListener("input", (e) => {
		if (e.target.classList.contains("error-border")) {
			e.target.classList.remove("error-border");
			const errorSpan = document.getElementById(`error-${e.target.id}`);
			if (errorSpan) errorSpan.classList.remove("show");
		}
	});

	whatsappForm.addEventListener("submit", (e) => {
		e.preventDefault(); // Prevent standard form submission

		let message = "مرحباً، لدي طلب جديد من خلال الموقع:\n\n";
		let isValid = true;
		let firstInvalidElement = null;

		// Extract values based on configuration
		for (const field of formConfig) {
			if (field.type === "section") {
				message += `\n*=== ${field.label} ===*\n`;
				continue;
			}

			const element = document.getElementById(field.id);
			if (element) {
				let val = "";
				if (field.type === "checkbox") {
					val = element.checked ? "نعم" : "لا";
				} else {
					val = element.value;
				}

				// Manual Validation
				if (field.required && (!val || val.trim() === "")) {
					element.classList.add("error-border");
					const errorSpan = document.getElementById(`error-${field.id}`);
					if (errorSpan) {
						errorSpan.textContent = "يرجى تعبئة هذا الحقل";
						errorSpan.classList.add("show");
					}

					if (!firstInvalidElement) firstInvalidElement = element;
					isValid = false;
				} else if (
					val &&
					val.trim() !== "" &&
					(field.id === "civilId" || field.id === "subCivilId")
				) {
					const validateCivilId = (id) => {
						if (!/^[1-3]\d{11}$/.test(id)) return false;
						const weights = [2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
						let sum = 0;
						for (let i = 0; i < 11; i++) {
							sum += parseInt(id[i], 10) * weights[i];
						}
						const checkDigit = (11 - (sum % 11)) % 11;
						return checkDigit === parseInt(id[11], 10);
					};

					if (!validateCivilId(val)) {
						element.classList.add("error-border");
						const errorSpan = document.getElementById(`error-${field.id}`);
						if (errorSpan) {
							errorSpan.textContent = "الرقم المدني غير صحيح";
							errorSpan.classList.add("show");
						}
						if (!firstInvalidElement) firstInvalidElement = element;
						isValid = false;
					} else {
						element.classList.remove("error-border");
						const errorSpan = document.getElementById(`error-${field.id}`);
						if (errorSpan) errorSpan.classList.remove("show");
						message += `*${field.label}:* ${val}\n`;
					}
				} else {
					element.classList.remove("error-border");
					const errorSpan = document.getElementById(`error-${field.id}`);
					if (errorSpan) errorSpan.classList.remove("show");

					// Only add to message if there is a value or it's a checkbox
					if ((val && val.trim() !== "") || field.type === "checkbox") {
						message += `*${field.label}:* ${val}\n`;
					}
				}
			}
		}

		if (!isValid) {
			if (firstInvalidElement) firstInvalidElement.focus();
			return;
		}

		// Encode and Redirect
		const encodedMessage = encodeURIComponent(message);
		const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

		window.open(whatsappUrl, "_blank");
	});
});
