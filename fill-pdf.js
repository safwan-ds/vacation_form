document.addEventListener("DOMContentLoaded", () => {
	// ── Theme Toggle ──
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
		setTheme(currentTheme === "dark" ? "light" : "dark");
	});

	// ── Field ID → Arabic label mapping (for preview display) ──
	const fieldLabels = {
		breakType: "نوع الإجازة",
		fullName: "الاسم الثلاثي",
		civilId: "الرقم المدني",
		mosqueName: "اسم المسجد",
		jobTitle: "المسمى الوظيفي",
		nationality: "الجنسية",
		phoneNumber: "رقم الهاتف",
		fileNumber: "الملف",
		fileContract: "العقد",
		leaveDuration: "مدة الإجازة",
		leaveStartDate: "بداية الإجازة",
		leaveEndDate: "نهاية الإجازة",
		assignedFridayPlan: "مكلف بخطة الجمعة؟",
		subFullName: "اسم البديل",
		subCivilId: "الرقم المدني (بديل)",
		subCurrentMosque: "المسجد الحالي",
		subJobTitle: "المسمى الوظيفي (بديل)",
		subNationality: "الجنسية (بديل)",
		subAssignedMosque: "مسجد الانتداب",
		subPhoneNumber: "رقم الهاتف (بديل)",
		subAssignedWork: "العمل المكلف به",
		subAssignmentDuration: "مدة التكليف",
		subStartDate: "بداية التكليف",
		subEndDate: "نهاية التكليف",
		fridayPreacherName: "اسم خطيب الجمعة",
		fridaySermonMosque: "مسجد الخطبة",
	};

	// ── Sections for preview grouping ──
	const sections = [
		{
			title: "بيانات الموظف",
			fields: [
				"breakType",
				"fullName",
				"civilId",
				"mosqueName",
				"jobTitle",
				"nationality",
				"phoneNumber",
				"fileNumber",
				"fileContract",
				"leaveDuration",
				"leaveStartDate",
				"leaveEndDate",
				"assignedFridayPlan",
			],
		},
		{
			title: "بيانات البديل",
			fields: [
				"subFullName",
				"subCivilId",
				"subCurrentMosque",
				"subJobTitle",
				"subNationality",
				"subAssignedMosque",
				"subPhoneNumber",
				"subAssignedWork",
				"subAssignmentDuration",
				"subStartDate",
				"subEndDate",
			],
		},
		{
			title: "بديل خطيب الجمعة",
			fields: ["fridayPreacherName", "fridaySermonMosque"],
		},
	];

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

	// ── DOM Elements ──
	const jsonInput = document.getElementById("json-input");
	const jsonError = document.getElementById("json-error");
	const jsonErrorText = document.getElementById("json-error-text");
	const parseBtn = document.getElementById("parse-btn");
	const stepPaste = document.getElementById("step-paste");
	const stepPreview = document.getElementById("step-preview");
	const previewContainer = document.getElementById("preview-container");
	const backBtn = document.getElementById("back-btn");
	const fillBtn = document.getElementById("fill-btn");
	const loadingOverlay = document.getElementById("loading-overlay");
	const successMessage = document.getElementById("success-message");
	const resetBtn = document.getElementById("reset-btn");

	let parsedData = null;
	let lastPdfBlob = null;
	let lastPdfFileName = null;

	// ── Enable/disable parse button based on input ──
	jsonInput.addEventListener("input", () => {
		const hasContent = jsonInput.value.trim().length > 0;
		parseBtn.disabled = !hasContent;

		// Hide error when typing
		if (jsonError.classList.contains("show")) {
			jsonError.classList.remove("show");
		}
	});

	// ── Parse JSON ──
	parseBtn.addEventListener("click", () => {
		const raw = jsonInput.value.trim();
		try {
			parsedData = JSON.parse(raw);
			if (typeof parsedData !== "object" || Array.isArray(parsedData)) {
				throw new Error("يجب أن تكون البيانات كائن JSON وليس مصفوفة");
			}
			showPreview(parsedData);
		} catch (err) {
			jsonErrorText.textContent = `خطأ في تحليل JSON: ${err.message}`;
			jsonError.classList.add("show");
		}
	});

	// ── Show Preview ──
	function showPreview(data) {
		previewContainer.innerHTML = "";

		for (const section of sections) {
			const sectionFields = section.fields.filter((f) => data[f] !== undefined);
			if (sectionFields.length === 0) continue;

			const sectionDiv = document.createElement("div");
			sectionDiv.className = "preview-section";

			const title = document.createElement("h3");
			title.className = "preview-section-title";
			title.textContent = section.title;
			sectionDiv.appendChild(title);

			const grid = document.createElement("div");
			grid.className = "preview-grid";

			for (const fieldId of sectionFields) {
				const item = document.createElement("div");
				item.className = "preview-item";

				// Make name/mosque fields full width
				if (
					fieldId === "fullName" ||
					fieldId === "mosqueName" ||
					fieldId === "subFullName" ||
					fieldId === "subCurrentMosque" ||
					fieldId === "subAssignedMosque"
				) {
					item.classList.add("full-width");
				}

				const label = document.createElement("span");
				label.className = "preview-label";
				label.textContent = fieldLabels[fieldId] || fieldId;

				const value = document.createElement("span");
				value.className = "preview-value";
				value.textContent = data[fieldId];

				item.appendChild(label);
				item.appendChild(value);
				grid.appendChild(item);
			}

			sectionDiv.appendChild(grid);
			previewContainer.appendChild(sectionDiv);
		}

		stepPaste.classList.remove("active");
		stepPreview.classList.add("active");
	}

	// ── Back button ──
	backBtn.addEventListener("click", () => {
		stepPreview.classList.remove("active");
		stepPaste.classList.add("active");
	});

	// ── Fill PDF ──
	fillBtn.addEventListener("click", async () => {
		if (!parsedData) return;

		loadingOverlay.classList.add("show");

		try {
			// Load the PDF template
			const pdfUrl = "إجازة الكترونية.pdf";
			const pdfBytes = await fetch(pdfUrl).then((res) => res.arrayBuffer());

			const { PDFDocument, PDFName, PDFBool, PDFString, PDFHexString, rgb } =
				PDFLib;
			const pdfDoc = await PDFDocument.load(pdfBytes);

			// Register fontkit and embed an Arabic font for proper rendering
			pdfDoc.registerFontkit(fontkit);
			const fontBytes = await fetch("cairo-regular.ttf").then((res) =>
				res.arrayBuffer(),
			);
			const arabicFont = await pdfDoc.embedFont(fontBytes, {
				subset: false,
			});

			const form = pdfDoc.getForm();

			// Known numeric field IDs (should contain only digits)
			const numericFields = new Set([
				"civilId",
				"fileNumber",
				"phoneNumber",
				"leaveDuration",
				"subCivilId",
				"subPhoneNumber",
				"subAssignmentDuration",
			]);

			// Array to store drawing operations to execute AFTER flattening
			const textDrawOperations = [];

			// CRITICAL: Clear ALL form fields upfront to prevent WinAnsi encoding crash.
			// The PDF template has Arabic default values pre-selected in dropdown fields.
			// If we don't clear them, flatten() will try to render them with the default
			// Latin font and crash silently with "WinAnsi cannot encode".
			const allFields = form.getFields();
			for (const field of allFields) {
				const type = field.constructor.name;
				if (type === "PDFDropdown") {
					try { field.clear(); } catch (e) { /* ignore */ }
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
			for (const [fieldId, rawValue] of Object.entries(parsedData)) {
				const mapping = pdfFieldMap[fieldId];
				if (!mapping) continue;

				// Ensure value is always a plain string
				let value = String(rawValue);

				// For numeric fields, strip commas, decimals, and non-digit characters
				if (numericFields.has(fieldId)) {
					value = value.replace(/[^0-9]/g, "");
				}

				try {
					if (mapping.type === "text" || mapping.type === "dropdown") {
						let field;
						let matchedValue = value;

						if (mapping.type === "text") {
							field = form.getTextField(mapping.pdfName);
						} else {
							field = form.getDropdown(mapping.pdfName);
							if (field) {
								const options = field.getOptions();
								const exactMatch = options.find((opt) => opt === value);
								if (!exactMatch) {
									const fuzzyMatch = options.find(
										(opt) =>
											opt.trim() === value.trim() ||
											opt.includes(value) ||
											value.includes(opt),
									);
									if (fuzzyMatch) matchedValue = fuzzyMatch;
								}
								field.clear(); 
							}
						}

						if (field) {
							// For text fields, clear any value or formatting
							if (mapping.type === "text") {
								field.setText("");
								field.acroField.dict.delete(PDFName.of("AA"));
							}

							const widgets = field.acroField.getWidgets();
							for (const widget of widgets) {
								if (mapping.type === "text") {
									widget.dict.delete(PDFName.of("AA"));
								}

								// Get bounding box before flatten() destroys it
								const rect = widget.getRectangle();
								
								// Calculate horizontal text width
								let size = 11;
								const textWidth = arabicFont.widthOfTextAtSize(matchedValue, size);
								
								// Shrink horizontally if text is too long for the box
								if (textWidth > rect.width - 4) {
									size = size * ((rect.width - 4) / textWidth);
									if (size < 6) size = 6; // Hard minimum to remain readable
								}

								// Queue the text drawing for AFTER flattening
								textDrawOperations.push({
									text: matchedValue,
									x: rect.x + 4,
									y: rect.y + 5,
									size: size
								});

								// Delete appearance streams so flatten() cleans up the widget seamlessly
								widget.dict.delete(PDFName.of("AP"));
							}
						}
					} else if (mapping.type === "radio") {
						// Radio: set /V and /AS directly (keeps existing AP streams for flatten)
						const fields = form.getFields();
						const field = fields.find(
							(f) => f.getName() === mapping.pdfName,
						);
						if (field) {
							const isYes = value === "نعم";
							const selectedValue = isYes ? "Yes" : "no";
							field.acroField.dict.set(
								PDFName.of("V"),
								PDFName.of(selectedValue),
							);
							const widgets = field.acroField.getWidgets();
							for (const widget of widgets) {
								const ap = widget.dict.get(PDFName.of("AP"));
								if (ap) {
									const normal = ap.get(PDFName.of("N"));
									if (normal) {
										const normalObj =
											normal instanceof PDFLib.PDFRef
												? pdfDoc.context.lookup(normal)
												: normal;
										const keys = normalObj.keys
											? normalObj.keys()
											: [];
										const hasSelected = keys.some(
											(k) =>
												k.toString() ===
												`/${selectedValue}`,
										);
										widget.dict.set(
											PDFName.of("AS"),
											PDFName.of(
												hasSelected
													? selectedValue
													: "Off",
											),
										);
									}
								}
							}
						}
					}
				} catch (fieldErr) {
					console.warn(
						`Could not fill field "${mapping.pdfName}" for "${fieldId}":`,
						fieldErr,
					);
				}
			}

			// Flatten the form: stamps field values as static content and removes all fields
			form.flatten();

			// Now draw the text ON TOP of the flattened document
			const pages = pdfDoc.getPages();
			for (const op of textDrawOperations) {
				pages[0].drawText(op.text, {
					x: op.x,
					y: op.y,
					size: op.size,
					font: arabicFont,
					color: rgb(0, 0, 0),
				});
			}

			const filledPdfBytes = await pdfDoc.save();
			const blob = new Blob([filledPdfBytes], { type: "application/pdf" });

			const employeeName = parsedData.fullName || "إجازة";
			const fileName = `إجازة - ${employeeName}.pdf`;

			// Store blob for Telegram sending
			lastPdfBlob = blob;
			lastPdfFileName = fileName;

			// Show success & reset Telegram state
			loadingOverlay.classList.remove("show");
			stepPreview.classList.remove("active");
			successMessage.classList.add("show");
			resetTelegramState();
		} catch (err) {
			loadingOverlay.classList.remove("show");
			console.error("Error filling PDF:", err);
			alert(`حدث خطأ أثناء تعبئة النموذج:\n${err.message}`);
		}
	});

	// ── Telegram Send ──
	const telegramSendBtn = document.getElementById("telegram-send-btn");
	const telegramSending = document.getElementById("telegram-sending");
	const telegramSent = document.getElementById("telegram-sent");
	const telegramError = document.getElementById("telegram-error");
	const telegramErrorText = document.getElementById("telegram-error-text");

	function resetTelegramState() {
		telegramSendBtn.disabled = false;
		telegramSendBtn.querySelector("span").textContent = "إرسال عبر تيليجرام";
		telegramSending.style.display = "none";
		telegramSent.style.display = "none";
		telegramError.style.display = "none";
	}

	async function sendToTelegram(blob, fileName) {
		const { botToken, chatId } = TELEGRAM_CONFIG;

		if (!botToken || botToken === "YOUR_BOT_TOKEN_HERE" || !chatId || chatId === "CHAT_ID_HERE") {
			throw new Error("لم يتم تكوين إعدادات تيليجرام بعد");
		}

		const formData = new FormData();
		formData.append("chat_id", chatId);
		formData.append("document", blob, fileName);
		formData.append("caption", `📄 ${fileName}`);

		const response = await fetch(
			`https://api.telegram.org/bot${botToken}/sendDocument`,
			{ method: "POST", body: formData }
		);

		const result = await response.json();
		if (!result.ok) {
			throw new Error(result.description || "فشل إرسال الملف");
		}
		return result;
	}

	telegramSendBtn.addEventListener("click", async () => {
		if (!lastPdfBlob) return;

		telegramSendBtn.disabled = true;
		telegramSending.style.display = "flex";
		telegramSent.style.display = "none";
		telegramError.style.display = "none";

		try {
			await sendToTelegram(lastPdfBlob, lastPdfFileName);
			telegramSending.style.display = "none";
			telegramSent.style.display = "flex";
			telegramSendBtn.querySelector("span").textContent = "تم الإرسال ✓";
		} catch (err) {
			telegramSending.style.display = "none";
			telegramError.style.display = "flex";
			telegramErrorText.textContent = `فشل الإرسال: ${err.message}`;
			telegramSendBtn.disabled = false;
		}
	});

	// ── Reset ──
	resetBtn.addEventListener("click", () => {
		successMessage.classList.remove("show");
		jsonInput.value = "";
		parseBtn.disabled = true;
		parsedData = null;
		lastPdfBlob = null;
		lastPdfFileName = null;
		stepPaste.classList.add("active");
		resetTelegramState();
	});
});
