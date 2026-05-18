document.addEventListener("DOMContentLoaded", async () => {
	const themeToggleBtn = document.getElementById("theme-toggle");
	const themeIcon = themeToggleBtn.querySelector("i");
	const htmlElement = document.documentElement;

	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
	const savedTheme = localStorage.getItem("theme");

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
		return;
	}
	const formConfig = config.fields;

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
				input.type = "text";
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

		if (field.required) {
			const errorSpan = document.createElement("span");
			errorSpan.className = "error-text";
			errorSpan.id = `error-${field.id}`;
			errorSpan.textContent = "يرجى تعبئة هذا الحقل";
			groupDiv.appendChild(errorSpan);
		}

		formContainer.appendChild(groupDiv);
	});

	const whatsappForm = document.getElementById("whatsapp-form");
	const WHATSAPP_NUMBER = config.whatsappNumber;

	whatsappForm.addEventListener("input", (e) => {
		if (e.target.classList.contains("error-border")) {
			e.target.classList.remove("error-border");
			const errorSpan = document.getElementById(`error-${e.target.id}`);
			if (errorSpan) errorSpan.classList.remove("show");
		}

		if (e.target.id === "leaveStartDate") {
			const endEl = document.getElementById("leaveEndDate");
			if (endEl && endEl.classList.contains("error-border")) {
				endEl.classList.remove("error-border");
				const errSpan = document.getElementById("error-leaveEndDate");
				if (errSpan) errSpan.classList.remove("show");
			}
		}
		if (e.target.id === "subStartDate") {
			const endEl = document.getElementById("subEndDate");
			if (endEl && endEl.classList.contains("error-border")) {
				endEl.classList.remove("error-border");
				const errSpan = document.getElementById("error-subEndDate");
				if (errSpan) errSpan.classList.remove("show");
			}
		}
	});

	whatsappForm.addEventListener("submit", (e) => {
		e.preventDefault();

		const formData = {};
		let isValid = true;
		let firstInvalidElement = null;
		let currentSection = "";

		for (const field of formConfig) {
			if (field.type === "section") {
				currentSection = field.label;
				continue;
			}

			const element = document.getElementById(field.id);
			if (element) {
				let val = "";
				if (field.type === "checkbox") {
					val = element.checked ? "نعم" : "لا";
				} else {
					val = element.value;
					// Strip commas, decimal points and non-digit chars from number/tel fields
					if (
						(field.type === "number" || field.type === "tel") &&
						val
					) {
						val = val.replace(/[^0-9]/g, "");
					}
				}

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
						formData[field.id] = val;
					}
				} else if (
					val &&
					val.trim() !== "" &&
					(field.id === "leaveEndDate" || field.id === "subEndDate")
				) {
					const startDateId =
						field.id === "leaveEndDate" ? "leaveStartDate" : "subStartDate";
					const startDateElement = document.getElementById(startDateId);
					const startDateVal = startDateElement ? startDateElement.value : "";
					let isDateValid = true;

					if (startDateVal && startDateVal.trim() !== "") {
						const startD = new Date(startDateVal);
						const endD = new Date(val);
						if (endD < startD) isDateValid = false;
					}

					if (!isDateValid) {
						element.classList.add("error-border");
						const errorSpan = document.getElementById(`error-${field.id}`);
						if (errorSpan) {
							errorSpan.textContent = "تاريخ النهاية يجب أن يكون بعد البداية";
							errorSpan.classList.add("show");
						}
						if (!firstInvalidElement) firstInvalidElement = element;
						isValid = false;
					} else {
						element.classList.remove("error-border");
						const errorSpan = document.getElementById(`error-${field.id}`);
						if (errorSpan) errorSpan.classList.remove("show");
						formData[field.id] = val;
					}
				} else {
					element.classList.remove("error-border");
					const errorSpan = document.getElementById(`error-${field.id}`);
					if (errorSpan) errorSpan.classList.remove("show");

					if ((val && val.trim() !== "") || field.type === "checkbox") {
						formData[field.id] = val;
					}
				}
			}
		}

		if (!isValid) {
			if (firstInvalidElement) firstInvalidElement.focus();
			return;
		}

		const jsonString = JSON.stringify(formData, null, 2);
		const encodedMessage = encodeURIComponent(jsonString);
		const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

		window.open(whatsappUrl, "_blank");
	});

	// 5. Auto-Fill Test Data (For test.html)
	const testFillBtn = document.getElementById("test-fill-btn");
	if (testFillBtn) {
		testFillBtn.addEventListener("click", () => {
			const testData = {
				breakType: "دورية",
				fullName: "أحمد محمد عبدالله",
				civilId: "290010101233", // Valid Kuwaiti Civil ID Checksum
				mosqueName: "مسجد الصحابة",
				jobTitle: "إمام وخطيب",
				nationality: "كويتي",
				phoneNumber: "90001234",
				fileNumber: "12345",
				fileContract: "إيرادات متفرغ",
				leaveDuration: "5",
				leaveStartDate: "2026-05-15",
				leaveEndDate: "2026-05-20",
				assignedFridayPlan: true,
				subFullName: "خالد سعيد محمد",
				subCivilId: "295050501234", // Valid Kuwaiti Civil ID Checksum
				subCurrentMosque: "مسجد النور",
				subJobTitle: "مؤذن",
				subAssignedMosque: "مسجد الصحابة",
				subNationality: "مصري",
				subPhoneNumber: "60001234",
				subAssignedWork: "الإمامة",
				subAssignmentDuration: "5",
				subStartDate: "2026-05-15",
				subEndDate: "2026-05-20",
				fridayPreacherName: "عمر خالد",
				fridaySermonMosque: "مسجد الفرقان"
			};

			for (const [id, value] of Object.entries(testData)) {
				const el = document.getElementById(id);
				if (el) {
					if (el.type === "checkbox") {
						el.checked = value;
					} else {
						el.value = value;
					}
					// Remove error border if it exists
					el.classList.remove("error-border");
					const errSpan = document.getElementById(`error-${id}`);
					if (errSpan) errSpan.classList.remove("show");
				}
			}
		});
	}
});
