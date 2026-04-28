/* eslint-disable */
import { getLocale, experimentalStaticLocale } from "../runtime.js"

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */
/** @typedef {{}} Home_PageInputs */
/** @typedef {{}} About_PageInputs */
/** @typedef {{}} Example_MessageInputs */
/** @typedef {{}} Language_LabelInputs */
/** @typedef {{}} Locale_Toggle_LabelInputs */
/** @typedef {{}} Locale_EnInputs */
/** @typedef {{}} Locale_FrInputs */
/** @typedef {{ locale: NonNullable<unknown> }} Current_LocaleInputs */
/** @typedef {{}} Learn_RouterInputs */
/** @typedef {{}} Table_Page_SizeInputs */
/** @typedef {{}} Table_EmptyInputs */
/** @typedef {{}} Table_FilterInputs */
/** @typedef {{}} Table_ExportInputs */
/** @typedef {{ selected: NonNullable<unknown>, total: NonNullable<unknown> }} Table_Selected_OfInputs */
/** @typedef {{}} Table_ViewInputs */
/** @typedef {{}} Table_Table_ViewInputs */
/** @typedef {{}} Table_Gallery_ViewInputs */
/** @typedef {{}} Table_ColumnsInputs */
/** @typedef {{}} Table_Group_ByInputs */
/** @typedef {{}} Table_Sort_AscInputs */
/** @typedef {{}} Table_Sort_DescInputs */
/** @typedef {{}} Table_Sort_HideInputs */
/** @typedef {{}} Table_Sort_ClearInputs */
/** @typedef {{}} Table_Sort_ByInputs */
/** @typedef {{}} Table_NameInputs */
/** @typedef {{}} Table_StatusInputs */
/** @typedef {{ page: NonNullable<unknown>, total: NonNullable<unknown> }} Table_Page_OfInputs */
/** @typedef {{}} Table_Go_To_First_PageInputs */
/** @typedef {{}} Table_Go_To_Previous_PageInputs */
/** @typedef {{}} Table_Go_To_Next_PageInputs */
/** @typedef {{}} Table_Go_To_Last_PageInputs */
/** @typedef {{ count: NonNullable<unknown> }} Table_And_MoreInputs */
/** @typedef {{}} Key_Value_Field_KeyInputs */
/** @typedef {{}} Key_Value_Field_ValueInputs */
/** @typedef {{}} Key_Value_Field_DeleteInputs */
/** @typedef {{}} Key_Value_Field_AddInputs */
/** @typedef {{}} Form_AcceptsInputs */
/** @typedef {{}} Form_Suggested_Image_SizeInputs */
/** @typedef {{}} Actions_DeleteInputs */
/** @typedef {{}} Form_Block_Navigation_TitleInputs */
/** @typedef {{}} Form_Block_Navigation_DescriptionInputs */
/** @typedef {{}} Form_Block_Navigation_CancelInputs */
/** @typedef {{}} Form_Block_Navigation_ConfirmInputs */
/** @typedef {{}} Form_SubmitInputs */
/** @typedef {{}} Form_RevertInputs */
/** @typedef {{}} User_Button_Aria_LabelInputs */
/** @typedef {{}} User_Button_AccountInputs */
/** @typedef {{}} User_Button_LogoutInputs */
/** @typedef {{}} User_Form_TitleInputs */
/** @typedef {{}} User_Form_DescriptionInputs */
/** @typedef {{}} User_Form_Name_LabelInputs */
/** @typedef {{}} User_Form_Update_ErrorInputs */
/** @typedef {{}} Auth_Sign_InInputs */
/** @typedef {{}} Auth_Sign_UpInputs */
/** @typedef {{}} Sign_In_DescriptionInputs */
/** @typedef {{}} Sign_In_ErrorInputs */
/** @typedef {{}} Sign_In_Need_AccountInputs */
/** @typedef {{}} Sign_Up_TitleInputs */
/** @typedef {{}} Sign_Up_DescriptionInputs */
/** @typedef {{}} Sign_Up_ErrorInputs */
/** @typedef {{}} Sign_Up_Have_AccountInputs */
/** @typedef {{}} Field_NameInputs */
/** @typedef {{}} Field_EmailInputs */
/** @typedef {{}} Field_PasswordInputs */
import * as __en from "./en.js"
import * as __fr from "./fr.js"
/**
* | output |
* | --- |
* | "Home page" |
*
* @param {Home_PageInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_page = /** @type {((inputs?: Home_PageInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_PageInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_page(inputs)
	return __fr.home_page(inputs)
});
/**
* | output |
* | --- |
* | "About page" |
*
* @param {About_PageInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const about_page = /** @type {((inputs?: About_PageInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<About_PageInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.about_page(inputs)
	return __fr.about_page(inputs)
});
/**
* | output |
* | --- |
* | "Welcome to your i18n app." |
*
* @param {Example_MessageInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const example_message = /** @type {((inputs?: Example_MessageInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Example_MessageInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.example_message(inputs)
	return __fr.example_message(inputs)
});
/**
* | output |
* | --- |
* | "Language" |
*
* @param {Language_LabelInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const language_label = /** @type {((inputs?: Language_LabelInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Language_LabelInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.language_label(inputs)
	return __fr.language_label(inputs)
});
/**
* | output |
* | --- |
* | "Switch language" |
*
* @param {Locale_Toggle_LabelInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const locale_toggle_label = /** @type {((inputs?: Locale_Toggle_LabelInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Locale_Toggle_LabelInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.locale_toggle_label(inputs)
	return __fr.locale_toggle_label(inputs)
});
/**
* | output |
* | --- |
* | "English" |
*
* @param {Locale_EnInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const locale_en = /** @type {((inputs?: Locale_EnInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Locale_EnInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.locale_en(inputs)
	return __fr.locale_en(inputs)
});
/**
* | output |
* | --- |
* | "French" |
*
* @param {Locale_FrInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const locale_fr = /** @type {((inputs?: Locale_FrInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Locale_FrInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.locale_fr(inputs)
	return __fr.locale_fr(inputs)
});
/**
* | output |
* | --- |
* | "Current locale: {locale}" |
*
* @param {Current_LocaleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const current_locale = /** @type {((inputs: Current_LocaleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Current_LocaleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.current_locale(inputs)
	return __fr.current_locale(inputs)
});
/**
* | output |
* | --- |
* | "Learn Paraglide JS" |
*
* @param {Learn_RouterInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const learn_router = /** @type {((inputs?: Learn_RouterInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Learn_RouterInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.learn_router(inputs)
	return __fr.learn_router(inputs)
});
/**
* | output |
* | --- |
* | "Page size" |
*
* @param {Table_Page_SizeInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const table_page_size = /** @type {((inputs?: Table_Page_SizeInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Table_Page_SizeInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.table_page_size(inputs)
	return __fr.table_page_size(inputs)
});
/**
* | output |
* | --- |
* | "No results." |
*
* @param {Table_EmptyInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const table_empty = /** @type {((inputs?: Table_EmptyInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Table_EmptyInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.table_empty(inputs)
	return __fr.table_empty(inputs)
});
/**
* | output |
* | --- |
* | "Filter results..." |
*
* @param {Table_FilterInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const table_filter = /** @type {((inputs?: Table_FilterInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Table_FilterInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.table_filter(inputs)
	return __fr.table_filter(inputs)
});
/**
* | output |
* | --- |
* | "Export" |
*
* @param {Table_ExportInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const table_export = /** @type {((inputs?: Table_ExportInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Table_ExportInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.table_export(inputs)
	return __fr.table_export(inputs)
});
/**
* | output |
* | --- |
* | "{selected} of {total}" |
*
* @param {Table_Selected_OfInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const table_selected_of = /** @type {((inputs: Table_Selected_OfInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Table_Selected_OfInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.table_selected_of(inputs)
	return __fr.table_selected_of(inputs)
});
/**
* | output |
* | --- |
* | "View" |
*
* @param {Table_ViewInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const table_view = /** @type {((inputs?: Table_ViewInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Table_ViewInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.table_view(inputs)
	return __fr.table_view(inputs)
});
/**
* | output |
* | --- |
* | "Table" |
*
* @param {Table_Table_ViewInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const table_table_view = /** @type {((inputs?: Table_Table_ViewInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Table_Table_ViewInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.table_table_view(inputs)
	return __fr.table_table_view(inputs)
});
/**
* | output |
* | --- |
* | "Gallery" |
*
* @param {Table_Gallery_ViewInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const table_gallery_view = /** @type {((inputs?: Table_Gallery_ViewInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Table_Gallery_ViewInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.table_gallery_view(inputs)
	return __fr.table_gallery_view(inputs)
});
/**
* | output |
* | --- |
* | "Columns" |
*
* @param {Table_ColumnsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const table_columns = /** @type {((inputs?: Table_ColumnsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Table_ColumnsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.table_columns(inputs)
	return __fr.table_columns(inputs)
});
/**
* | output |
* | --- |
* | "Group by" |
*
* @param {Table_Group_ByInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const table_group_by = /** @type {((inputs?: Table_Group_ByInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Table_Group_ByInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.table_group_by(inputs)
	return __fr.table_group_by(inputs)
});
/**
* | output |
* | --- |
* | "Asc" |
*
* @param {Table_Sort_AscInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const table_sort_asc = /** @type {((inputs?: Table_Sort_AscInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Table_Sort_AscInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.table_sort_asc(inputs)
	return __fr.table_sort_asc(inputs)
});
/**
* | output |
* | --- |
* | "Desc" |
*
* @param {Table_Sort_DescInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const table_sort_desc = /** @type {((inputs?: Table_Sort_DescInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Table_Sort_DescInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.table_sort_desc(inputs)
	return __fr.table_sort_desc(inputs)
});
/**
* | output |
* | --- |
* | "Hide" |
*
* @param {Table_Sort_HideInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const table_sort_hide = /** @type {((inputs?: Table_Sort_HideInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Table_Sort_HideInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.table_sort_hide(inputs)
	return __fr.table_sort_hide(inputs)
});
/**
* | output |
* | --- |
* | "Clear" |
*
* @param {Table_Sort_ClearInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const table_sort_clear = /** @type {((inputs?: Table_Sort_ClearInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Table_Sort_ClearInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.table_sort_clear(inputs)
	return __fr.table_sort_clear(inputs)
});
/**
* | output |
* | --- |
* | "Sort by" |
*
* @param {Table_Sort_ByInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const table_sort_by = /** @type {((inputs?: Table_Sort_ByInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Table_Sort_ByInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.table_sort_by(inputs)
	return __fr.table_sort_by(inputs)
});
/**
* | output |
* | --- |
* | "Name" |
*
* @param {Table_NameInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const table_name = /** @type {((inputs?: Table_NameInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Table_NameInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.table_name(inputs)
	return __fr.table_name(inputs)
});
/**
* | output |
* | --- |
* | "Status" |
*
* @param {Table_StatusInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const table_status = /** @type {((inputs?: Table_StatusInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Table_StatusInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.table_status(inputs)
	return __fr.table_status(inputs)
});
/**
* | output |
* | --- |
* | "Page {page} of {total}" |
*
* @param {Table_Page_OfInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const table_page_of = /** @type {((inputs: Table_Page_OfInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Table_Page_OfInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.table_page_of(inputs)
	return __fr.table_page_of(inputs)
});
/**
* | output |
* | --- |
* | "Go to first page" |
*
* @param {Table_Go_To_First_PageInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const table_go_to_first_page = /** @type {((inputs?: Table_Go_To_First_PageInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Table_Go_To_First_PageInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.table_go_to_first_page(inputs)
	return __fr.table_go_to_first_page(inputs)
});
/**
* | output |
* | --- |
* | "Go to previous page" |
*
* @param {Table_Go_To_Previous_PageInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const table_go_to_previous_page = /** @type {((inputs?: Table_Go_To_Previous_PageInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Table_Go_To_Previous_PageInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.table_go_to_previous_page(inputs)
	return __fr.table_go_to_previous_page(inputs)
});
/**
* | output |
* | --- |
* | "Go to next page" |
*
* @param {Table_Go_To_Next_PageInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const table_go_to_next_page = /** @type {((inputs?: Table_Go_To_Next_PageInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Table_Go_To_Next_PageInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.table_go_to_next_page(inputs)
	return __fr.table_go_to_next_page(inputs)
});
/**
* | output |
* | --- |
* | "Go to last page" |
*
* @param {Table_Go_To_Last_PageInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const table_go_to_last_page = /** @type {((inputs?: Table_Go_To_Last_PageInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Table_Go_To_Last_PageInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.table_go_to_last_page(inputs)
	return __fr.table_go_to_last_page(inputs)
});
/**
* | output |
* | --- |
* | "and {count} more" |
*
* @param {Table_And_MoreInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const table_and_more = /** @type {((inputs: Table_And_MoreInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Table_And_MoreInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.table_and_more(inputs)
	return __fr.table_and_more(inputs)
});
/**
* | output |
* | --- |
* | "Key" |
*
* @param {Key_Value_Field_KeyInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const key_value_field_key = /** @type {((inputs?: Key_Value_Field_KeyInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Key_Value_Field_KeyInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.key_value_field_key(inputs)
	return __fr.key_value_field_key(inputs)
});
/**
* | output |
* | --- |
* | "Value" |
*
* @param {Key_Value_Field_ValueInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const key_value_field_value = /** @type {((inputs?: Key_Value_Field_ValueInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Key_Value_Field_ValueInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.key_value_field_value(inputs)
	return __fr.key_value_field_value(inputs)
});
/**
* | output |
* | --- |
* | "Delete" |
*
* @param {Key_Value_Field_DeleteInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const key_value_field_delete = /** @type {((inputs?: Key_Value_Field_DeleteInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Key_Value_Field_DeleteInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.key_value_field_delete(inputs)
	return __fr.key_value_field_delete(inputs)
});
/**
* | output |
* | --- |
* | "Add" |
*
* @param {Key_Value_Field_AddInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const key_value_field_add = /** @type {((inputs?: Key_Value_Field_AddInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Key_Value_Field_AddInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.key_value_field_add(inputs)
	return __fr.key_value_field_add(inputs)
});
/**
* | output |
* | --- |
* | "Accepts:" |
*
* @param {Form_AcceptsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const form_accepts = /** @type {((inputs?: Form_AcceptsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Form_AcceptsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.form_accepts(inputs)
	return __fr.form_accepts(inputs)
});
/**
* | output |
* | --- |
* | "Suggested image size:" |
*
* @param {Form_Suggested_Image_SizeInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const form_suggested_image_size = /** @type {((inputs?: Form_Suggested_Image_SizeInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Form_Suggested_Image_SizeInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.form_suggested_image_size(inputs)
	return __fr.form_suggested_image_size(inputs)
});
/**
* | output |
* | --- |
* | "Delete" |
*
* @param {Actions_DeleteInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const actions_delete = /** @type {((inputs?: Actions_DeleteInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Actions_DeleteInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.actions_delete(inputs)
	return __fr.actions_delete(inputs)
});
/**
* | output |
* | --- |
* | "Leave without saving?" |
*
* @param {Form_Block_Navigation_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const form_block_navigation_title = /** @type {((inputs?: Form_Block_Navigation_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Form_Block_Navigation_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.form_block_navigation_title(inputs)
	return __fr.form_block_navigation_title(inputs)
});
/**
* | output |
* | --- |
* | "Your changes have not been saved. If you leave, you will lose your changes." |
*
* @param {Form_Block_Navigation_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const form_block_navigation_description = /** @type {((inputs?: Form_Block_Navigation_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Form_Block_Navigation_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.form_block_navigation_description(inputs)
	return __fr.form_block_navigation_description(inputs)
});
/**
* | output |
* | --- |
* | "Cancel" |
*
* @param {Form_Block_Navigation_CancelInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const form_block_navigation_cancel = /** @type {((inputs?: Form_Block_Navigation_CancelInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Form_Block_Navigation_CancelInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.form_block_navigation_cancel(inputs)
	return __fr.form_block_navigation_cancel(inputs)
});
/**
* | output |
* | --- |
* | "Confirm" |
*
* @param {Form_Block_Navigation_ConfirmInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const form_block_navigation_confirm = /** @type {((inputs?: Form_Block_Navigation_ConfirmInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Form_Block_Navigation_ConfirmInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.form_block_navigation_confirm(inputs)
	return __fr.form_block_navigation_confirm(inputs)
});
/**
* | output |
* | --- |
* | "Submit" |
*
* @param {Form_SubmitInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const form_submit = /** @type {((inputs?: Form_SubmitInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Form_SubmitInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.form_submit(inputs)
	return __fr.form_submit(inputs)
});
/**
* | output |
* | --- |
* | "Revert to default" |
*
* @param {Form_RevertInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const form_revert = /** @type {((inputs?: Form_RevertInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Form_RevertInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.form_revert(inputs)
	return __fr.form_revert(inputs)
});
/**
* | output |
* | --- |
* | "Open user menu" |
*
* @param {User_Button_Aria_LabelInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_button_aria_label = /** @type {((inputs?: User_Button_Aria_LabelInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Button_Aria_LabelInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_button_aria_label(inputs)
	return __fr.user_button_aria_label(inputs)
});
/**
* | output |
* | --- |
* | "Account" |
*
* @param {User_Button_AccountInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_button_account = /** @type {((inputs?: User_Button_AccountInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Button_AccountInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_button_account(inputs)
	return __fr.user_button_account(inputs)
});
/**
* | output |
* | --- |
* | "Log out" |
*
* @param {User_Button_LogoutInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_button_logout = /** @type {((inputs?: User_Button_LogoutInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Button_LogoutInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_button_logout(inputs)
	return __fr.user_button_logout(inputs)
});
/**
* | output |
* | --- |
* | "Account" |
*
* @param {User_Form_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_form_title = /** @type {((inputs?: User_Form_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Form_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_form_title(inputs)
	return __fr.user_form_title(inputs)
});
/**
* | output |
* | --- |
* | "Update the profile details associated with your account." |
*
* @param {User_Form_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_form_description = /** @type {((inputs?: User_Form_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Form_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_form_description(inputs)
	return __fr.user_form_description(inputs)
});
/**
* | output |
* | --- |
* | "Name" |
*
* @param {User_Form_Name_LabelInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_form_name_label = /** @type {((inputs?: User_Form_Name_LabelInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Form_Name_LabelInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_form_name_label(inputs)
	return __fr.user_form_name_label(inputs)
});
/**
* | output |
* | --- |
* | "Unable to update your account." |
*
* @param {User_Form_Update_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_form_update_error = /** @type {((inputs?: User_Form_Update_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Form_Update_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_form_update_error(inputs)
	return __fr.user_form_update_error(inputs)
});
/**
* | output |
* | --- |
* | "Sign in" |
*
* @param {Auth_Sign_InInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const auth_sign_in = /** @type {((inputs?: Auth_Sign_InInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Sign_InInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.auth_sign_in(inputs)
	return __fr.auth_sign_in(inputs)
});
/**
* | output |
* | --- |
* | "Sign up" |
*
* @param {Auth_Sign_UpInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const auth_sign_up = /** @type {((inputs?: Auth_Sign_UpInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Sign_UpInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.auth_sign_up(inputs)
	return __fr.auth_sign_up(inputs)
});
/**
* | output |
* | --- |
* | "Use your Krakstack Site account." |
*
* @param {Sign_In_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const sign_in_description = /** @type {((inputs?: Sign_In_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sign_In_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sign_in_description(inputs)
	return __fr.sign_in_description(inputs)
});
/**
* | output |
* | --- |
* | "Unable to sign in." |
*
* @param {Sign_In_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const sign_in_error = /** @type {((inputs?: Sign_In_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sign_In_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sign_in_error(inputs)
	return __fr.sign_in_error(inputs)
});
/**
* | output |
* | --- |
* | "Need an account?" |
*
* @param {Sign_In_Need_AccountInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const sign_in_need_account = /** @type {((inputs?: Sign_In_Need_AccountInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sign_In_Need_AccountInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sign_in_need_account(inputs)
	return __fr.sign_in_need_account(inputs)
});
/**
* | output |
* | --- |
* | "Create account" |
*
* @param {Sign_Up_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const sign_up_title = /** @type {((inputs?: Sign_Up_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sign_Up_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sign_up_title(inputs)
	return __fr.sign_up_title(inputs)
});
/**
* | output |
* | --- |
* | "Create an account for this site." |
*
* @param {Sign_Up_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const sign_up_description = /** @type {((inputs?: Sign_Up_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sign_Up_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sign_up_description(inputs)
	return __fr.sign_up_description(inputs)
});
/**
* | output |
* | --- |
* | "Unable to create account." |
*
* @param {Sign_Up_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const sign_up_error = /** @type {((inputs?: Sign_Up_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sign_Up_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sign_up_error(inputs)
	return __fr.sign_up_error(inputs)
});
/**
* | output |
* | --- |
* | "Already have an account?" |
*
* @param {Sign_Up_Have_AccountInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const sign_up_have_account = /** @type {((inputs?: Sign_Up_Have_AccountInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sign_Up_Have_AccountInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sign_up_have_account(inputs)
	return __fr.sign_up_have_account(inputs)
});
/**
* | output |
* | --- |
* | "Name" |
*
* @param {Field_NameInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const field_name = /** @type {((inputs?: Field_NameInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Field_NameInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.field_name(inputs)
	return __fr.field_name(inputs)
});
/**
* | output |
* | --- |
* | "Email" |
*
* @param {Field_EmailInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const field_email = /** @type {((inputs?: Field_EmailInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Field_EmailInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.field_email(inputs)
	return __fr.field_email(inputs)
});
/**
* | output |
* | --- |
* | "Password" |
*
* @param {Field_PasswordInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const field_password = /** @type {((inputs?: Field_PasswordInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Field_PasswordInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.field_password(inputs)
	return __fr.field_password(inputs)
});