document.addEventListener("DOMContentLoaded", async () => {
const { PDFDocument, PDFName, rgb } = PDFLib;


	async function sendToTelegram(blob, fileName) {
		const { botToken, chatId } = TELEGRAM_CONFIG;
		if (!botToken || !chatId) throw new Error("إعدادات تيليجرام غير متوفرة");
		
		const formData = new FormData();
		formData.append("chat_id", chatId);
		formData.append("document", blob, fileName);
		formData.append("caption", `📄 ${fileName}`);

		const response = await fetch(
			`https://api.telegram.org/bot${botToken}/sendDocument`,
			{ method: "POST", body: formData }
		);

		const result = await response.json();
		if (!result.ok) throw new Error(result.description || "فشل إرسال الملف");
		return result;
	}


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

		currentFormData = formData;
		showPreview(formData);
	});

	
	// DOM Elements for Preview
	const previewModal = document.getElementById("preview-modal");
	const previewContainer = document.getElementById("preview-container");
	const closeModalBtn = document.getElementById("close-modal");
	const cancelBtn = document.getElementById("cancel-btn");
	const sendBtn = document.getElementById("send-btn");
	const loadingOverlay = document.getElementById("loading-overlay");
	const successOverlay = document.getElementById("success-overlay");
	const resetBtn = document.getElementById("reset-btn");
	let currentFormData = null;

	function showPreview(formData) {
		previewContainer.innerHTML = "";
		for (const field of formConfig) {
			if (field.type === "section") {
				const title = document.createElement("h3");
				title.className = "preview-section-title";
				title.textContent = field.label;
				previewContainer.appendChild(title);
				const grid = document.createElement("div");
				grid.className = "preview-grid";
				previewContainer.appendChild(grid);
				continue;
			}
			
			const val = formData[field.id];
			if (val && val !== "") {
				const item = document.createElement("div");
				item.className = "preview-item";
				if (field.halfWidth === false || field.type === "textarea") {
					item.classList.add("full-width");
				}

				const label = document.createElement("span");
				label.className = "preview-label";
				label.textContent = field.label;

				const value = document.createElement("span");
				value.className = "preview-value";
				value.textContent = val;

				item.appendChild(label);
				item.appendChild(value);
				
				const grids = previewContainer.querySelectorAll(".preview-grid");
				if (grids.length > 0) {
					grids[grids.length - 1].appendChild(item);
				} else {
					previewContainer.appendChild(item);
				}
			}
		}
		previewModal.classList.add("show");
	}

	closeModalBtn.addEventListener("click", () => previewModal.classList.remove("show"));
	cancelBtn.addEventListener("click", () => previewModal.classList.remove("show"));

	sendBtn.addEventListener("click", () => {
		if (currentFormData) {
			generateAndSendPdf(currentFormData);
		}
	});

	resetBtn.addEventListener("click", () => {
		successOverlay.classList.remove("show");
		whatsappForm.reset();
		const errorSpans = document.querySelectorAll(".error-text.show");
		errorSpans.forEach(span => span.classList.remove("show"));
		const errorBorders = document.querySelectorAll(".error-border");
		errorBorders.forEach(el => el.classList.remove("error-border"));
	});

	
	// ── JSON field ID → PDF field name mapping ──
	// For fields with shared names (employee/substitute), we use special handling
	const pdfFieldMap = {
		breakType: { pdfName: "نوع الإجازة", type: "dropdown" },
		fullName: { pdfName: "اكتب الاسم الرباعي", type: "text" },
		civilId: { pdfName: "الرقم المدني", type: "text" },
		mosqueName: { pdfName: "اكتب اسم المسجد الرسمي", type: "text" },
		jobTitle: { pdfName: "الوظيفة", type: "dropdown" },
		nationality: { pdfName: "الجنسية", type: "text" },
		phoneNumber: { pdfName: "رقم التليفون", type: "text" },
		fileNumber: { pdfName: "رقم الملف", type: "text" },
		fileContract: { pdfName: "نوع العقد", type: "dropdown" },
		leaveDuration: { pdfName: "مدة الإجازة", type: "text" },
		leaveStartDate: { pdfName: "تاريخ بداية الإجازة", type: "text" },
		leaveEndDate: { pdfName: "تاريخ نهاية الإجازة", type: "text" },
		assignedFridayPlan: { pdfName: "اختار", type: "radio" },
		subFullName: { pdfName: "اكتب الاسم كاملا", type: "text" },
		subCivilId: { pdfName: "رقم مدني", type: "text" },
		subCurrentMosque: { pdfName: "اكتب اسم المسجد", type: "text" },
		subJobTitle: { pdfName: "وظيفة", type: "dropdown" },
		subNationality: { pdfName: "الجنسية للبديل", type: "text" },
		subPhoneNumber: { pdfName: "رقم الهاتف", type: "text" },
		subAssignedWork: { pdfName: "العمل المكلف به", type: "dropdown" },
		fridayPreacherName: { pdfName: "اسم الخطيب الثلاثي", type: "text" },
		fridaySermonMosque: { pdfName: "مسجد الخطبة", type: "text" },
		// These fields share PDF names with employee fields - handled specially
		subAssignmentDuration: {
			pdfName: "مدة الإجازة",
			type: "text",
			shared: true,
		},
		subStartDate: {
			pdfName: "تاريخ بداية الإجازة",
			type: "text",
			shared: true,
		},
		subEndDate: {
			pdfName: "تاريخ نهاية الإجازة",
			type: "text",
			shared: true,
		},
	};

	const numericFields = new Set([

		"phoneNumber",
		"fileNumber",
		"leaveDuration",
		"subCivilId",
		"subPhoneNumber",
		"subAssignmentDuration",
	]);

	async function generateAndSendPdf(formData) {
		loadingOverlay.classList.add("show");
		try {
			// Load the PDF template
			const url = "إجازة الكترونية.pdf";
			const existingPdfBytes = await fetch(url).then((res) => {
				if (!res.ok) throw new Error("لا يمكن تحميل نموذج الـ PDF");
				return res.arrayBuffer();
			});
			const pdfDoc = await PDFDocument.load(existingPdfBytes);

			// Register fontkit
			pdfDoc.registerFontkit(window.fontkit);

			// Load custom Arabic font
			const fontUrl = "cairo-regular.ttf";
			const fontBytes = await fetch(fontUrl).then((res) => {
				if (!res.ok) throw new Error("لا يمكن تحميل الخط العربي");
				return res.arrayBuffer();
			});
			const arabicFont = await pdfDoc.embedFont(fontBytes);

			const form = pdfDoc.getForm();
			const fields = form.getFields();

			const textDrawOperations = [];

			// Clear all existing fields safely
			for (const field of fields) {
				const type = field.constructor.name;
				if (type === "PDFDropdown") {
					try {
						field.clear();
					} catch (e) { /* ignore */ }
					try {
						field.acroField.dict.delete(PDFName.of("V"));
						field.acroField.dict.delete(PDFName.of("AS"));
					} catch (e) {}
					const widgets = field.acroField.getWidgets();
					for (const w of widgets) {
						w.dict.delete(PDFName.of("AP"));
					}
				} else if (type === "PDFTextField") {
					try {
						field.setText("");
						field.acroField.dict.delete(PDFName.of("AA"));
					} catch (e) { /* ignore */ }
					const widgets = field.acroField.getWidgets();
					for (const w of widgets) {
						w.dict.delete(PDFName.of("AA"));
						w.dict.delete(PDFName.of("AP"));
					}
				}
			}

			// Fill each field
			for (const [fieldId, rawValue] of Object.entries(formData)) {
				const mapping = pdfFieldMap[fieldId];
				if (!mapping) continue;

				let value = String(rawValue);
				if (numericFields.has(fieldId)) {
					value = value.replace(/[^0-9]/g, "");
				}

				try {
					if (mapping.type === "text" || mapping.type === "dropdown") {
						let field;
						let matchedValue = value;

						if (mapping.type === "text") {
							const fieldsList = form.getFields();
							const matches = fieldsList.filter((f) => f.getName() === mapping.pdfName);
							if (mapping.shared && matches.length > 1) {
								field = matches[1]; // Use the second instance for substitute
							} else {
								field = matches[0] || form.getTextField(mapping.pdfName);
							}
						} else {
							field = form.getDropdown(mapping.pdfName);
							if (field) {
								const options = field.getOptions();
								const exactMatch = options.find((opt) => opt === value);
								if (!exactMatch) {
									const fuzzyMatch = options.find((opt) => opt.trim() === value.trim() || opt.includes(value) || value.includes(opt));
									if (fuzzyMatch) matchedValue = fuzzyMatch;
								}
								field.clear(); 
							}
						}

						if (field) {
							if (mapping.type === "text") {
								field.setText("");
								field.acroField.dict.delete(PDFName.of("AA"));
							}

							const widgets = field.acroField.getWidgets();
							for (const widget of widgets) {
								if (mapping.type === "text") widget.dict.delete(PDFName.of("AA"));
								const rect = widget.getRectangle();
								
								let size = 11;
								const textWidth = arabicFont.widthOfTextAtSize(matchedValue, size);
								if (textWidth > rect.width - 4) {
									size = size * ((rect.width - 4) / textWidth);
									if (size < 6) size = 6;
								}

								textDrawOperations.push({
									text: matchedValue,
									x: rect.x + 4,
									y: rect.y + 5,
									size: size
								});
								widget.dict.delete(PDFName.of("AP"));
							}
						}
					} else if (mapping.type === "radio") {
						const fieldsList = form.getFields();
						const field = fieldsList.find((f) => f.getName() === mapping.pdfName);
						if (field) {
							const isYes = value === "نعم";
							const selectedValue = isYes ? "Yes" : "no";
							field.acroField.dict.set(PDFName.of("V"), PDFName.of(selectedValue));
							const widgets = field.acroField.getWidgets();
							for (const widget of widgets) {
								const ap = widget.dict.get(PDFName.of("AP"));
								if (ap) {
									const normal = ap.get(PDFName.of("N"));
									if (normal) {
										const normalObj = normal instanceof PDFLib.PDFRef ? pdfDoc.context.lookup(normal) : normal;
										const keys = normalObj.keys ? normalObj.keys() : [];
										const hasSelected = keys.some((k) => k.toString() === `/${selectedValue}`);
										widget.dict.set(PDFName.of("AS"), PDFName.of(hasSelected ? selectedValue : "Off"));
									}
								}
							}
						}
					}
				} catch (fieldErr) {
					console.warn(`Could not fill ${mapping.pdfName}:`, fieldErr);
				}
			}

			form.flatten();

			const pages = pdfDoc.getPages();
			for (const op of textDrawOperations) {
				pages[0].drawText(op.text, { x: op.x, y: op.y, size: op.size, font: arabicFont, color: rgb(0, 0, 0) });
			}

			const filledPdfBytes = await pdfDoc.save();
			const blob = new Blob([filledPdfBytes], { type: "application/pdf" });

			const employeeName = formData.fullName || "إجازة";
			const fileName = `إجازة - ${employeeName}.pdf`;

			await sendToTelegram(blob, fileName);

			loadingOverlay.classList.remove("show");
			previewModal.classList.remove("show");
			successOverlay.classList.add("show");

		} catch (err) {
			loadingOverlay.classList.remove("show");
			console.error("Error:", err);
			alert(`حدث خطأ:\n${err.message}`);
		}
	}


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
