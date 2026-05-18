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

			const { PDFDocument, PDFName, PDFBool, PDFString, PDFHexString } =
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
					if (mapping.type === "text") {
						const field = form.getTextField(mapping.pdfName);
						if (field) {
							// Remove number formatting scripts (AFNumber_Format)
							field.acroField.dict.delete(PDFName.of("AA"));
							const widgets = field.acroField.getWidgets();
							for (const widget of widgets) {
								widget.dict.delete(PDFName.of("AA"));
							}
							// Set value and render with Arabic font
							field.setText(value);
							field.updateAppearances(arabicFont);
						}
					} else if (mapping.type === "dropdown") {
						const field = form.getDropdown(mapping.pdfName);
						if (field) {
							// Find matching option (handle whitespace differences)
							const options = field.getOptions();
							let matchedValue = value;
							const exactMatch = options.find(
								(opt) => opt === value,
							);
							if (!exactMatch) {
								const fuzzyMatch = options.find(
									(opt) =>
										opt.trim() === value.trim() ||
										opt.includes(value) ||
										value.includes(opt),
								);
								if (fuzzyMatch) matchedValue = fuzzyMatch;
							}
							field.select(matchedValue);
							field.updateAppearances(arabicFont);
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

			const filledPdfBytes = await pdfDoc.save();
			const blob = new Blob([filledPdfBytes], { type: "application/pdf" });
			const url = URL.createObjectURL(blob);

			const link = document.createElement("a");
			link.href = url;
			const employeeName = parsedData.fullName || "إجازة";
			link.download = `إجازة - ${employeeName}.pdf`;
			link.click();

			URL.revokeObjectURL(url);

			// Show success
			loadingOverlay.classList.remove("show");
			stepPreview.classList.remove("active");
			successMessage.classList.add("show");
		} catch (err) {
			loadingOverlay.classList.remove("show");
			console.error("Error filling PDF:", err);
			alert(`حدث خطأ أثناء تعبئة النموذج:\n${err.message}`);
		}
	});

	// ── Reset ──
	resetBtn.addEventListener("click", () => {
		successMessage.classList.remove("show");
		jsonInput.value = "";
		parseBtn.disabled = true;
		parsedData = null;
		stepPaste.classList.add("active");
	});
});
