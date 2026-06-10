document.addEventListener("DOMContentLoaded", async () => {
const { PDFDocument, PDFName, PDFBool, rgb } = PDFLib;


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
						if (field.required) option.disabled = true;
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
			} else if (field.type === "signature") {
				const container = document.createElement("div");
				container.className = "signature-container";
				
				const canvas = document.createElement("canvas");
				canvas.id = field.id;
				canvas.className = "signature-pad";
				
				const actions = document.createElement("div");
				actions.className = "signature-actions";
				
				const clearBtn = document.createElement("button");
				clearBtn.type = "button";
				clearBtn.className = "clear-signature-btn";
				clearBtn.textContent = "مسح التوقيع";
				
				actions.appendChild(clearBtn);
				container.appendChild(canvas);
				container.appendChild(actions);
				groupDiv.appendChild(container);
				
				let isDrawing = false;
				let ctx = canvas.getContext('2d');
				
				const resizeCanvas = () => {
					const rect = canvas.getBoundingClientRect();
					canvas.width = rect.width;
					canvas.height = rect.height;
					ctx.strokeStyle = '#000000';
					ctx.lineWidth = 2;
					ctx.lineCap = 'round';
				};
				
				setTimeout(resizeCanvas, 100);
				window.addEventListener('resize', resizeCanvas);
				
				const getPos = (evt) => {
					const rect = canvas.getBoundingClientRect();
					const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
					const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
					return { x: clientX - rect.left, y: clientY - rect.top };
				};
				
				const startDrawing = (evt) => {
					console.log('startDrawing called!');
					isDrawing = true;
					canvas.removeAttribute('data-empty');
					const pos = getPos(evt);
					ctx.beginPath();
					ctx.moveTo(pos.x, pos.y);
					evt.preventDefault();
				};
				
				const draw = (evt) => {
					if (!isDrawing) return;
					const pos = getPos(evt);
					ctx.lineTo(pos.x, pos.y);
					ctx.stroke();
					evt.preventDefault();
				};
				
				const stopDrawing = () => { isDrawing = false; };
				
				canvas.addEventListener('mousedown', startDrawing);
				canvas.addEventListener('mousemove', draw);
				canvas.addEventListener('mouseup', stopDrawing);
				canvas.addEventListener('mouseout', stopDrawing);
				canvas.addEventListener('touchstart', startDrawing, {passive: false});
				canvas.addEventListener('touchmove', draw, {passive: false});
				canvas.addEventListener('touchend', stopDrawing);
				
				clearBtn.addEventListener('click', () => {
					ctx.clearRect(0, 0, canvas.width, canvas.height);
					canvas.setAttribute('data-empty', 'true');
				});
				
				canvas.setAttribute('data-empty', 'true');
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
				} else if (field.type === "signature") {
					val = element.getAttribute('data-empty') === 'true' ? "" : element.toDataURL('image/png');
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

		const calcDur = (start, end) => {
			if (start && end) {
				const s = new Date(start);
				const e = new Date(end);
				if (e >= s) return String(Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24)) + 1);
			}
			return "";
		};
		formData.leaveDuration = calcDur(formData.leaveStartDate, formData.leaveEndDate);
		formData.subAssignmentDuration = calcDur(formData.subStartDate, formData.subEndDate);

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
				if (field.halfWidth === false || field.type === "textarea" || field.type === "signature") {
					item.classList.add("full-width");
				}

				const label = document.createElement("span");
				label.className = "preview-label";
				label.textContent = field.label;

				let value;
				if (field.type === "signature") {
					value = document.createElement("img");
					value.src = val;
					value.style.maxHeight = "100px";
					value.style.background = "white";
					value.style.border = "1px solid #ccc";
				} else {
					value = document.createElement("span");
					value.className = "preview-value";
					value.textContent = val;
				}

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

		const addExtraField = (labelStr, valueStr) => {
			if (!valueStr) return;
			const item = document.createElement("div");
			item.className = "preview-item";
			const label = document.createElement("span");
			label.className = "preview-label";
			label.textContent = labelStr;
			const value = document.createElement("span");
			value.className = "preview-value";
			value.textContent = valueStr;
			item.appendChild(label);
			item.appendChild(value);
			const grids = previewContainer.querySelectorAll(".preview-grid");
			if (grids.length > 0) {
				grids[grids.length - 1].appendChild(item);
			} else {
				previewContainer.appendChild(item);
			}
		};
		addExtraField("مدة الإجازة", formData.leaveDuration);
		addExtraField("مدة التكليف", formData.subAssignmentDuration);

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
	const pdfFieldMap = {
		breakType: { pdfName: "type", type: "text" },
		fullName: { pdfName: "name1", type: "text" },
		civilId: { pdfName: "civilID1", type: "text" },
		mosqueName: { pdfName: "mosque1", type: "text" },
		jobTitle: { pdfName: "job1", type: "text" },
		nationality: { pdfName: "nation1", type: "text" },
		phoneNumber: { pdfName: "tel1", type: "text" },
		fileNumber: { pdfName: "fileNo", type: "text" },
		fileContract: { pdfName: "contract", type: "text" },
		leaveDuration: { pdfName: "vacDuration", type: "text" },
		leaveStartDate: { pdfName: "vacStart", type: "text" },
		leaveEndDate: { pdfName: "vacEnd", type: "text" },
		assignedFridayPlan: { type: "yesno_checkboxes" },
		subFullName: { pdfName: "name2", type: "text" },
		subCivilId: { pdfName: "civilID2", type: "text" },
		subCurrentMosque: { pdfName: "mosque2", type: "text" },
		subJobTitle: { pdfName: "job2", type: "text" },
		subNationality: { pdfName: "nation2", type: "text" },
		subPhoneNumber: { pdfName: "tel2", type: "text" },
		subAssignedWork: { pdfName: "work", type: "text" },
		subAssignedMosque: { pdfName: "mosque3", type: "text" },
		subAssignmentDuration: { pdfName: "workDuration", type: "text" },
		subStartDate: { pdfName: "workStart", type: "text" },
		subEndDate: { pdfName: "workEnd", type: "text" },
		date: { pdfName: "date", type: "text" },
		hijriDate: { pdfName: "hijriDate", type: "text" },
		applicantSignature: { pdfName: "sign", type: "signature" }
	};

	const numericFields = new Set([
		"phoneNumber",
		"fileNumber",
		"subCivilId",
		"subPhoneNumber",
	]);

	async function generateAndSendPdf(formData) {
		loadingOverlay.classList.add("show");
		try {
			// Load the PDF template
			const url = "form.pdf";
			const existingPdfBytes = await fetch(url).then((res) => {
				if (!res.ok) throw new Error("لا يمكن تحميل نموذج الـ PDF");
				return res.arrayBuffer();
			});
			const pdfDoc = await PDFDocument.load(existingPdfBytes);

			const form = pdfDoc.getForm();

			// Set NeedAppearances to true so the PDF viewer renders the text with the original fonts
			form.acroForm.dict.set(PDFName.of('NeedAppearances'), PDFBool.True);

			const today = new Date();
			const gregorianDate = today.toISOString().split("T")[0]; 
			const hijriDateStr = new Intl.DateTimeFormat('sv-SE-u-ca-islamic', {
				day: '2-digit', 
				month: '2-digit', 
				year : 'numeric'
			}).format(today).replace(' AH', '');

			const calcDur = (start, end) => {
				if (start && end) {
					const s = new Date(start);
					const e = new Date(end);
					if (e >= s) return String(Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24)) + 1);
				}
				return "";
			};
			formData.leaveDuration = calcDur(formData.leaveStartDate, formData.leaveEndDate);
			formData.subAssignmentDuration = calcDur(formData.subStartDate, formData.subEndDate);

			formData.date = gregorianDate;
			formData.hijriDate = hijriDateStr;

			// Utility to rasterize Arabic text correctly using the browser's native text shaping
			function createTextPng(text, width, height) {
				const scale = 4; // High DPI for crisp text
				const canvas = document.createElement('canvas');
				canvas.width = width * scale;
				canvas.height = height * scale;
				const ctx = canvas.getContext('2d');
				ctx.scale(scale, scale);
				
				let fontSize = 13;
				ctx.font = `${fontSize}px "Amiri", "Times New Roman", serif`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillStyle = 'black';
				
				let textMetrics = ctx.measureText(text);
				while (textMetrics.width > width - 4 && fontSize > 6) {
					fontSize--;
					ctx.font = `${fontSize}px "Amiri", "Times New Roman", serif`;
					textMetrics = ctx.measureText(text);
				}
				
				ctx.fillText(text, width / 2, height / 2 + 1);
				return canvas.toDataURL('image/png');
			}

			// Ensure fonts are loaded before drawing
			await document.fonts.ready;

			// Fill each field natively or via rasterization
			for (const [fieldId, rawValue] of Object.entries(formData)) {
				const mapping = pdfFieldMap[fieldId];
				if (!mapping) continue;

				let value = String(rawValue);
				if (numericFields.has(fieldId)) {
					value = value.replace(/[^0-9]/g, "");
				}

				if (!value) continue;

				try {
					if (mapping.type === "text" || mapping.type === "dropdown") {
						const fieldsList = form.getFields();
						const matches = fieldsList.filter((f) => f.getName() === mapping.pdfName);
						let field;
						
						if (mapping.type === "text") {
							if (mapping.shared && matches.length > 1) field = matches[1]; 
							else field = matches[0];
						} else {
							field = form.getDropdown(mapping.pdfName);
						}

						if (field) {
							let matchedValue = value;
							if (mapping.type === "dropdown") {
								const options = field.getOptions();
								const exactMatch = options.find((opt) => opt === value);
								if (!exactMatch) {
									const fuzzyMatch = options.find((opt) => opt.trim() === value.trim() || opt.includes(value) || value.includes(opt));
									if (fuzzyMatch) matchedValue = fuzzyMatch;
								}
							}

							const widgets = field.acroField.getWidgets();
							for (const widget of widgets) {
								const rect = widget.getRectangle();
								const pageRef = widget.dict.get(PDFName.of('P'));
								let page = pdfDoc.getPages().find(p => p.ref === pageRef);
								if (!page) page = pdfDoc.getPages()[0];

								const pngUrl = createTextPng(matchedValue, rect.width, rect.height);
								const img = await pdfDoc.embedPng(pngUrl);
								page.drawImage(img, { x: rect.x, y: rect.y, width: rect.width, height: rect.height });
							}
						}
					} else if (mapping.type === "yesno_checkboxes") {
						const isYes = value === "نعم";
						const yesField = form.getCheckBox("yes");
						const noField = form.getCheckBox("no");
						if (isYes) {
							if (yesField) yesField.check();
							if (noField) noField.uncheck();
						} else {
							if (yesField) yesField.uncheck();
							if (noField) noField.check();
						}
					} else if (mapping.type === "signature") {
						if (value) {
							const img = await pdfDoc.embedPng(value);
							const fieldsList = form.getFields();
							const field = fieldsList.find((f) => f.getName() === mapping.pdfName);
							if (field) {
								const widgets = field.acroField.getWidgets();
								for (const widget of widgets) {
									const rect = widget.getRectangle();
									const pages = pdfDoc.getPages();
									pages[0].drawImage(img, {
										x: rect.x,
										y: rect.y,
										width: rect.width,
										height: rect.height
									});
								}
							}
						}
					}
				} catch (fieldErr) {
					console.warn(`Could not fill ${mapping.pdfName}:`, fieldErr);
				}
			}

			// Flatten the form to seal it and ensure it renders on all mobile viewers
			form.flatten();

			// Save without generating appearances so pdf-lib doesn't throw encoding errors
			const filledPdfBytes = await pdfDoc.save({ updateFieldAppearances: false });

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
				subStartDate: "2026-05-15",
				subEndDate: "2026-05-20"
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
