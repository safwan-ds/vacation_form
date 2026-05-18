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
			const form = pdfDoc.getForm();

			// Set NeedAppearances flag so the PDF viewer renders
			// field values using the PDF's own embedded Arabic fonts,
			// instead of pdf-lib trying to render with WinAnsi Helvetica.
			form.acroForm.dict.set(
				PDFName.of("NeedAppearances"),
				PDFBool.True,
			);

			// Helper: Set a text field value directly on the PDF dictionary,
			// bypassing pdf-lib's setText() which triggers updateWidgetAppearance
			// and fails on Arabic characters (WinAnsi encoding error).
			function setTextFieldRaw(fieldName, textValue) {
				try {
					const field = form.getTextField(fieldName);
					if (field) {
						// Set /V (value) directly using PDFHexString for Unicode support
						field.acroField.dict.set(
							PDFName.of("V"),
							PDFHexString.fromText(textValue),
						);
						// Remove existing appearance streams so the viewer regenerates them
						const widgets = field.acroField.getWidgets();
						for (const widget of widgets) {
							widget.dict.delete(PDFName.of("AP"));
						}
					}
				} catch (err) {
					console.warn(
						`Could not set text field "${fieldName}":`,
						err,
					);
				}
			}

			// Helper: Set a dropdown value directly on the PDF dictionary
			function setDropdownField(fieldName, textValue) {
				try {
					const field = form.getDropdown(fieldName);
					if (field) {
						// Find the matching option (handling whitespace differences)
						const options = field.getOptions();
						let matchedValue = textValue;
						const exactMatch = options.find(
							(opt) => opt === textValue,
						);
						if (!exactMatch) {
							const fuzzyMatch = options.find(
								(opt) =>
									opt.trim() === textValue.trim() ||
									opt.includes(textValue) ||
									textValue.includes(opt),
							);
							if (fuzzyMatch) matchedValue = fuzzyMatch;
						}

						// Set /V directly using PDFHexString to avoid WinAnsi encoding errors
						field.acroField.dict.set(
							PDFName.of("V"),
							PDFHexString.fromText(matchedValue),
						);
						// Remove appearance streams so viewer regenerates
						const widgets = field.acroField.getWidgets();
						for (const widget of widgets) {
							widget.dict.delete(PDFName.of("AP"));
						}
					}
				} catch (err) {
					console.warn(
						`Could not set dropdown "${fieldName}":`,
						err,
					);
				}
			}

			// Helper: Set radio/checkbox value directly on the PDF dictionary
			function setRadioField(fieldName, textValue) {
				try {
					// Find the field in the form's fields array
					const fields = form.getFields();
					const field = fields.find(
						(f) => f.getName() === fieldName,
					);
					if (!field) return;

					const isYes = textValue === "نعم";
					const selectedValue = isYes ? "Yes" : "no";

					// Set the /V value on the field dictionary
					field.acroField.dict.set(
						PDFName.of("V"),
						PDFName.of(selectedValue),
					);

					// Update each widget's /AS (appearance state)
					const widgets = field.acroField.getWidgets();
					for (const widget of widgets) {
						// Check what appearance names this widget has
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
								const hasSelectedValue = keys.some(
									(k) => k.toString() === `/${selectedValue}`,
								);
								if (hasSelectedValue) {
									widget.dict.set(
										PDFName.of("AS"),
										PDFName.of(selectedValue),
									);
								} else {
									widget.dict.set(
										PDFName.of("AS"),
										PDFName.of("Off"),
									);
								}
							}
						}
					}
				} catch (err) {
					console.warn(
						`Could not set radio/checkbox "${fieldName}":`,
						err,
					);
				}
			}

			// Fill each field
			for (const [fieldId, value] of Object.entries(parsedData)) {
				const mapping = pdfFieldMap[fieldId];
				if (!mapping) continue;

				if (mapping.type === "text") {
					setTextFieldRaw(mapping.pdfName, value);
				} else if (mapping.type === "dropdown") {
					setDropdownField(mapping.pdfName, value);
				} else if (mapping.type === "radio") {
					setRadioField(mapping.pdfName, value);
				}
			}

			// Save WITHOUT updating field appearances (to avoid Arabic encoding errors).
			// The NeedAppearances flag tells the PDF viewer to render the values itself.
			const filledPdfBytes = await pdfDoc.save({
				updateFieldAppearances: false,
			});
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
