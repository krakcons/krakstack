/* eslint-disable */
import { getLocale, experimentalStaticLocale } from "../runtime.js"

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */
/** @typedef {{}} App_NameInputs */
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
/** @typedef {{}} User_Button_SecurityInputs */
/** @typedef {{}} User_Button_Api_KeysInputs */
/** @typedef {{}} User_Central_Auth_RequiredInputs */
/** @typedef {{}} User_Central_Auth_ReconnectInputs */
/** @typedef {{}} User_Central_Auth_Reconnect_ErrorInputs */
/** @typedef {{}} User_Profile_TitleInputs */
/** @typedef {{}} User_Profile_DescriptionInputs */
/** @typedef {{}} User_Profile_Photo_LabelInputs */
/** @typedef {{}} User_Field_PasswordInputs */
/** @typedef {{}} User_Security_TitleInputs */
/** @typedef {{}} User_Security_DescriptionInputs */
/** @typedef {{}} User_Two_Factor_TitleInputs */
/** @typedef {{}} User_Two_Factor_DescriptionInputs */
/** @typedef {{}} User_Two_Factor_EnabledInputs */
/** @typedef {{}} User_Two_Factor_DisabledInputs */
/** @typedef {{}} User_Two_Factor_Enabled_MessageInputs */
/** @typedef {{}} User_Two_Factor_Disabled_MessageInputs */
/** @typedef {{}} User_Two_Factor_Enable_ErrorInputs */
/** @typedef {{}} User_Two_Factor_Disable_ErrorInputs */
/** @typedef {{}} User_Two_Factor_Verify_ErrorInputs */
/** @typedef {{}} User_Two_Factor_CodeInputs */
/** @typedef {{}} User_Two_Factor_Scan_TitleInputs */
/** @typedef {{}} User_Two_Factor_Scan_DescriptionInputs */
/** @typedef {{}} User_Two_Factor_Backup_Codes_WarningInputs */
/** @typedef {{}} User_Api_Keys_TitleInputs */
/** @typedef {{}} User_Api_Keys_DescriptionInputs */
/** @typedef {{}} User_Api_Keys_Load_ErrorInputs */
/** @typedef {{}} User_Api_Key_NameInputs */
/** @typedef {{}} User_Api_Key_StatusInputs */
/** @typedef {{}} User_Api_Key_Create_ErrorInputs */
/** @typedef {{}} User_Api_Key_Delete_ErrorInputs */
/** @typedef {{}} User_Api_Key_Created_TitleInputs */
/** @typedef {{}} User_Api_Key_Created_DescriptionInputs */
/** @typedef {{}} User_Api_Key_EnabledInputs */
/** @typedef {{}} User_Api_Key_DisabledInputs */
/** @typedef {{}} User_Api_Key_HiddenInputs */
/** @typedef {{ start: NonNullable<unknown> }} User_Api_Key_Starts_WithInputs */
/** @typedef {{}} User_LoadingInputs */
/** @typedef {{}} User_DeleteInputs */
/** @typedef {{}} User_Accounts_TitleInputs */
/** @typedef {{}} User_Accounts_DescriptionInputs */
/** @typedef {{}} User_Account_Google_TitleInputs */
/** @typedef {{}} User_Account_Google_DescriptionInputs */
/** @typedef {{}} User_Account_Google_ConnectInputs */
/** @typedef {{}} User_Account_Google_Link_ErrorInputs */
/** @typedef {{}} User_Accounts_Load_ErrorInputs */
/** @typedef {{}} User_Account_ConnectedInputs */
/** @typedef {{}} User_Account_Not_ConnectedInputs */
/** @typedef {{}} User_Account_RevokeInputs */
/** @typedef {{}} User_Account_Confirm_RevokeInputs */
/** @typedef {{ provider: NonNullable<unknown> }} User_Account_Revoke_DescriptionInputs */
/** @typedef {{}} User_Account_Revoke_ErrorInputs */
/** @typedef {{}} User_Account_Only_MethodInputs */
/** @typedef {{}} User_Account_CancelInputs */
/** @typedef {{}} User_Account_Password_TitleInputs */
/** @typedef {{}} User_Account_Password_DescriptionInputs */
/** @typedef {{}} User_Account_Password_Connected_DescriptionInputs */
/** @typedef {{}} User_Account_Password_SetInputs */
/** @typedef {{}} User_Account_New_PasswordInputs */
/** @typedef {{}} User_Account_Password_Set_ErrorInputs */
/** @typedef {{}} User_Account_Password_Verify_ErrorInputs */
/** @typedef {{}} User_Account_Password_Change_TitleInputs */
/** @typedef {{}} User_Account_Password_Change_DescriptionInputs */
/** @typedef {{}} User_Account_Current_PasswordInputs */
/** @typedef {{}} User_Account_Password_Change_SubmitInputs */
/** @typedef {{}} User_Account_Password_Change_SuccessInputs */
/** @typedef {{}} User_Account_Password_Change_ErrorInputs */
/** @typedef {{}} Organizations_TitleInputs */
/** @typedef {{}} Organizations_DescriptionInputs */
/** @typedef {{}} Organization_Create_TitleInputs */
/** @typedef {{}} Organization_Create_DescriptionInputs */
/** @typedef {{}} Organization_Edit_TitleInputs */
/** @typedef {{}} Organization_Edit_DescriptionInputs */
/** @typedef {{}} Organization_NameInputs */
/** @typedef {{}} Organization_SlugInputs */
/** @typedef {{}} Organization_Slug_DescriptionInputs */
/** @typedef {{}} Organization_Create_ErrorInputs */
/** @typedef {{}} Organization_Update_ErrorInputs */
/** @typedef {{}} Organization_Switcher_EmptyInputs */
/** @typedef {{}} Organization_Switcher_No_Other_OrganizationsInputs */
/** @typedef {{}} Organization_Switcher_LabelInputs */
/** @typedef {{}} Organization_Switcher_ManageInputs */
/** @typedef {{}} Organization_LoadingInputs */
import * as __en from "./en.js"
import * as __fr from "./fr.js"
/**
* | output |
* | --- |
* | "Documentation" |
*
* @param {App_NameInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const app_name = /** @type {((inputs?: App_NameInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<App_NameInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.app_name(inputs)
	return __fr.app_name(inputs)
});
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
/**
* | output |
* | --- |
* | "Security" |
*
* @param {User_Button_SecurityInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_button_security = /** @type {((inputs?: User_Button_SecurityInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Button_SecurityInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_button_security(inputs)
	return __fr.user_button_security(inputs)
});
/**
* | output |
* | --- |
* | "API keys" |
*
* @param {User_Button_Api_KeysInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_button_api_keys = /** @type {((inputs?: User_Button_Api_KeysInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Button_Api_KeysInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_button_api_keys(inputs)
	return __fr.user_button_api_keys(inputs)
});
/**
* | output |
* | --- |
* | "Reconnect to Krakstack Auth to manage your central account settings." |
*
* @param {User_Central_Auth_RequiredInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_central_auth_required = /** @type {((inputs?: User_Central_Auth_RequiredInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Central_Auth_RequiredInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_central_auth_required(inputs)
	return __fr.user_central_auth_required(inputs)
});
/**
* | output |
* | --- |
* | "Reconnect account" |
*
* @param {User_Central_Auth_ReconnectInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_central_auth_reconnect = /** @type {((inputs?: User_Central_Auth_ReconnectInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Central_Auth_ReconnectInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_central_auth_reconnect(inputs)
	return __fr.user_central_auth_reconnect(inputs)
});
/**
* | output |
* | --- |
* | "Could not reconnect to Krakstack Auth." |
*
* @param {User_Central_Auth_Reconnect_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_central_auth_reconnect_error = /** @type {((inputs?: User_Central_Auth_Reconnect_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Central_Auth_Reconnect_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_central_auth_reconnect_error(inputs)
	return __fr.user_central_auth_reconnect_error(inputs)
});
/**
* | output |
* | --- |
* | "Profile" |
*
* @param {User_Profile_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_profile_title = /** @type {((inputs?: User_Profile_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Profile_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_profile_title(inputs)
	return __fr.user_profile_title(inputs)
});
/**
* | output |
* | --- |
* | "Update your public profile details." |
*
* @param {User_Profile_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_profile_description = /** @type {((inputs?: User_Profile_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Profile_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_profile_description(inputs)
	return __fr.user_profile_description(inputs)
});
/**
* | output |
* | --- |
* | "Profile photo URL" |
*
* @param {User_Profile_Photo_LabelInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_profile_photo_label = /** @type {((inputs?: User_Profile_Photo_LabelInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Profile_Photo_LabelInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_profile_photo_label(inputs)
	return __fr.user_profile_photo_label(inputs)
});
/**
* | output |
* | --- |
* | "Password" |
*
* @param {User_Field_PasswordInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_field_password = /** @type {((inputs?: User_Field_PasswordInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Field_PasswordInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_field_password(inputs)
	return __fr.user_field_password(inputs)
});
/**
* | output |
* | --- |
* | "Security" |
*
* @param {User_Security_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_security_title = /** @type {((inputs?: User_Security_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Security_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_security_title(inputs)
	return __fr.user_security_title(inputs)
});
/**
* | output |
* | --- |
* | "Protect your account with authenticator app verification." |
*
* @param {User_Security_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_security_description = /** @type {((inputs?: User_Security_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Security_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_security_description(inputs)
	return __fr.user_security_description(inputs)
});
/**
* | output |
* | --- |
* | "Two-factor authentication" |
*
* @param {User_Two_Factor_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_two_factor_title = /** @type {((inputs?: User_Two_Factor_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Two_Factor_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_two_factor_title(inputs)
	return __fr.user_two_factor_title(inputs)
});
/**
* | output |
* | --- |
* | "Use a time-based one-time password from your authenticator app." |
*
* @param {User_Two_Factor_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_two_factor_description = /** @type {((inputs?: User_Two_Factor_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Two_Factor_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_two_factor_description(inputs)
	return __fr.user_two_factor_description(inputs)
});
/**
* | output |
* | --- |
* | "Enabled" |
*
* @param {User_Two_Factor_EnabledInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_two_factor_enabled = /** @type {((inputs?: User_Two_Factor_EnabledInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Two_Factor_EnabledInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_two_factor_enabled(inputs)
	return __fr.user_two_factor_enabled(inputs)
});
/**
* | output |
* | --- |
* | "Disabled" |
*
* @param {User_Two_Factor_DisabledInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_two_factor_disabled = /** @type {((inputs?: User_Two_Factor_DisabledInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Two_Factor_DisabledInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_two_factor_disabled(inputs)
	return __fr.user_two_factor_disabled(inputs)
});
/**
* | output |
* | --- |
* | "Two-factor authentication is enabled." |
*
* @param {User_Two_Factor_Enabled_MessageInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_two_factor_enabled_message = /** @type {((inputs?: User_Two_Factor_Enabled_MessageInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Two_Factor_Enabled_MessageInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_two_factor_enabled_message(inputs)
	return __fr.user_two_factor_enabled_message(inputs)
});
/**
* | output |
* | --- |
* | "Two-factor authentication is disabled." |
*
* @param {User_Two_Factor_Disabled_MessageInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_two_factor_disabled_message = /** @type {((inputs?: User_Two_Factor_Disabled_MessageInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Two_Factor_Disabled_MessageInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_two_factor_disabled_message(inputs)
	return __fr.user_two_factor_disabled_message(inputs)
});
/**
* | output |
* | --- |
* | "Could not start two-factor setup." |
*
* @param {User_Two_Factor_Enable_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_two_factor_enable_error = /** @type {((inputs?: User_Two_Factor_Enable_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Two_Factor_Enable_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_two_factor_enable_error(inputs)
	return __fr.user_two_factor_enable_error(inputs)
});
/**
* | output |
* | --- |
* | "Could not disable two-factor authentication." |
*
* @param {User_Two_Factor_Disable_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_two_factor_disable_error = /** @type {((inputs?: User_Two_Factor_Disable_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Two_Factor_Disable_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_two_factor_disable_error(inputs)
	return __fr.user_two_factor_disable_error(inputs)
});
/**
* | output |
* | --- |
* | "Could not verify the code." |
*
* @param {User_Two_Factor_Verify_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_two_factor_verify_error = /** @type {((inputs?: User_Two_Factor_Verify_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Two_Factor_Verify_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_two_factor_verify_error(inputs)
	return __fr.user_two_factor_verify_error(inputs)
});
/**
* | output |
* | --- |
* | "Authentication code" |
*
* @param {User_Two_Factor_CodeInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_two_factor_code = /** @type {((inputs?: User_Two_Factor_CodeInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Two_Factor_CodeInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_two_factor_code(inputs)
	return __fr.user_two_factor_code(inputs)
});
/**
* | output |
* | --- |
* | "Scan this QR code" |
*
* @param {User_Two_Factor_Scan_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_two_factor_scan_title = /** @type {((inputs?: User_Two_Factor_Scan_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Two_Factor_Scan_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_two_factor_scan_title(inputs)
	return __fr.user_two_factor_scan_title(inputs)
});
/**
* | output |
* | --- |
* | "Add this account to your authenticator app, then enter the generated code below." |
*
* @param {User_Two_Factor_Scan_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_two_factor_scan_description = /** @type {((inputs?: User_Two_Factor_Scan_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Two_Factor_Scan_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_two_factor_scan_description(inputs)
	return __fr.user_two_factor_scan_description(inputs)
});
/**
* | output |
* | --- |
* | "Save these backup codes now. They are shown only during setup." |
*
* @param {User_Two_Factor_Backup_Codes_WarningInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_two_factor_backup_codes_warning = /** @type {((inputs?: User_Two_Factor_Backup_Codes_WarningInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Two_Factor_Backup_Codes_WarningInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_two_factor_backup_codes_warning(inputs)
	return __fr.user_two_factor_backup_codes_warning(inputs)
});
/**
* | output |
* | --- |
* | "API keys" |
*
* @param {User_Api_Keys_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_api_keys_title = /** @type {((inputs?: User_Api_Keys_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Api_Keys_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_api_keys_title(inputs)
	return __fr.user_api_keys_title(inputs)
});
/**
* | output |
* | --- |
* | "Create and manage API keys for your user account." |
*
* @param {User_Api_Keys_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_api_keys_description = /** @type {((inputs?: User_Api_Keys_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Api_Keys_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_api_keys_description(inputs)
	return __fr.user_api_keys_description(inputs)
});
/**
* | output |
* | --- |
* | "Could not load API keys." |
*
* @param {User_Api_Keys_Load_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_api_keys_load_error = /** @type {((inputs?: User_Api_Keys_Load_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Api_Keys_Load_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_api_keys_load_error(inputs)
	return __fr.user_api_keys_load_error(inputs)
});
/**
* | output |
* | --- |
* | "Key name" |
*
* @param {User_Api_Key_NameInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_api_key_name = /** @type {((inputs?: User_Api_Key_NameInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Api_Key_NameInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_api_key_name(inputs)
	return __fr.user_api_key_name(inputs)
});
/**
* | output |
* | --- |
* | "Status" |
*
* @param {User_Api_Key_StatusInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_api_key_status = /** @type {((inputs?: User_Api_Key_StatusInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Api_Key_StatusInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_api_key_status(inputs)
	return __fr.user_api_key_status(inputs)
});
/**
* | output |
* | --- |
* | "Could not create the API key." |
*
* @param {User_Api_Key_Create_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_api_key_create_error = /** @type {((inputs?: User_Api_Key_Create_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Api_Key_Create_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_api_key_create_error(inputs)
	return __fr.user_api_key_create_error(inputs)
});
/**
* | output |
* | --- |
* | "Could not delete the API key." |
*
* @param {User_Api_Key_Delete_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_api_key_delete_error = /** @type {((inputs?: User_Api_Key_Delete_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Api_Key_Delete_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_api_key_delete_error(inputs)
	return __fr.user_api_key_delete_error(inputs)
});
/**
* | output |
* | --- |
* | "API key created" |
*
* @param {User_Api_Key_Created_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_api_key_created_title = /** @type {((inputs?: User_Api_Key_Created_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Api_Key_Created_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_api_key_created_title(inputs)
	return __fr.user_api_key_created_title(inputs)
});
/**
* | output |
* | --- |
* | "Copy this key now. You will not be able to see it again." |
*
* @param {User_Api_Key_Created_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_api_key_created_description = /** @type {((inputs?: User_Api_Key_Created_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Api_Key_Created_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_api_key_created_description(inputs)
	return __fr.user_api_key_created_description(inputs)
});
/**
* | output |
* | --- |
* | "Enabled" |
*
* @param {User_Api_Key_EnabledInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_api_key_enabled = /** @type {((inputs?: User_Api_Key_EnabledInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Api_Key_EnabledInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_api_key_enabled(inputs)
	return __fr.user_api_key_enabled(inputs)
});
/**
* | output |
* | --- |
* | "Disabled" |
*
* @param {User_Api_Key_DisabledInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_api_key_disabled = /** @type {((inputs?: User_Api_Key_DisabledInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Api_Key_DisabledInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_api_key_disabled(inputs)
	return __fr.user_api_key_disabled(inputs)
});
/**
* | output |
* | --- |
* | "Secret hidden" |
*
* @param {User_Api_Key_HiddenInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_api_key_hidden = /** @type {((inputs?: User_Api_Key_HiddenInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Api_Key_HiddenInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_api_key_hidden(inputs)
	return __fr.user_api_key_hidden(inputs)
});
/**
* | output |
* | --- |
* | "Starts with {start}" |
*
* @param {User_Api_Key_Starts_WithInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_api_key_starts_with = /** @type {((inputs: User_Api_Key_Starts_WithInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Api_Key_Starts_WithInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_api_key_starts_with(inputs)
	return __fr.user_api_key_starts_with(inputs)
});
/**
* | output |
* | --- |
* | "Loading..." |
*
* @param {User_LoadingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_loading = /** @type {((inputs?: User_LoadingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_LoadingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_loading(inputs)
	return __fr.user_loading(inputs)
});
/**
* | output |
* | --- |
* | "Delete" |
*
* @param {User_DeleteInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_delete = /** @type {((inputs?: User_DeleteInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_DeleteInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_delete(inputs)
	return __fr.user_delete(inputs)
});
/**
* | output |
* | --- |
* | "Accounts" |
*
* @param {User_Accounts_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_accounts_title = /** @type {((inputs?: User_Accounts_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Accounts_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_accounts_title(inputs)
	return __fr.user_accounts_title(inputs)
});
/**
* | output |
* | --- |
* | "Connect external sign-in providers to this account." |
*
* @param {User_Accounts_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_accounts_description = /** @type {((inputs?: User_Accounts_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Accounts_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_accounts_description(inputs)
	return __fr.user_accounts_description(inputs)
});
/**
* | output |
* | --- |
* | "Google" |
*
* @param {User_Account_Google_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_account_google_title = /** @type {((inputs?: User_Account_Google_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Account_Google_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_account_google_title(inputs)
	return __fr.user_account_google_title(inputs)
});
/**
* | output |
* | --- |
* | "Use your Google account as a sign-in option." |
*
* @param {User_Account_Google_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_account_google_description = /** @type {((inputs?: User_Account_Google_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Account_Google_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_account_google_description(inputs)
	return __fr.user_account_google_description(inputs)
});
/**
* | output |
* | --- |
* | "Connect Google" |
*
* @param {User_Account_Google_ConnectInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_account_google_connect = /** @type {((inputs?: User_Account_Google_ConnectInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Account_Google_ConnectInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_account_google_connect(inputs)
	return __fr.user_account_google_connect(inputs)
});
/**
* | output |
* | --- |
* | "Could not connect Google." |
*
* @param {User_Account_Google_Link_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_account_google_link_error = /** @type {((inputs?: User_Account_Google_Link_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Account_Google_Link_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_account_google_link_error(inputs)
	return __fr.user_account_google_link_error(inputs)
});
/**
* | output |
* | --- |
* | "Could not load connected accounts." |
*
* @param {User_Accounts_Load_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_accounts_load_error = /** @type {((inputs?: User_Accounts_Load_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Accounts_Load_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_accounts_load_error(inputs)
	return __fr.user_accounts_load_error(inputs)
});
/**
* | output |
* | --- |
* | "Connected" |
*
* @param {User_Account_ConnectedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_account_connected = /** @type {((inputs?: User_Account_ConnectedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Account_ConnectedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_account_connected(inputs)
	return __fr.user_account_connected(inputs)
});
/**
* | output |
* | --- |
* | "Not connected" |
*
* @param {User_Account_Not_ConnectedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_account_not_connected = /** @type {((inputs?: User_Account_Not_ConnectedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Account_Not_ConnectedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_account_not_connected(inputs)
	return __fr.user_account_not_connected(inputs)
});
/**
* | output |
* | --- |
* | "Revoke" |
*
* @param {User_Account_RevokeInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_account_revoke = /** @type {((inputs?: User_Account_RevokeInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Account_RevokeInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_account_revoke(inputs)
	return __fr.user_account_revoke(inputs)
});
/**
* | output |
* | --- |
* | "Revoke account" |
*
* @param {User_Account_Confirm_RevokeInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_account_confirm_revoke = /** @type {((inputs?: User_Account_Confirm_RevokeInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Account_Confirm_RevokeInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_account_confirm_revoke(inputs)
	return __fr.user_account_confirm_revoke(inputs)
});
/**
* | output |
* | --- |
* | "Revoke {provider} from this account. You will not be able to use it to sign in unless you connect it again." |
*
* @param {User_Account_Revoke_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_account_revoke_description = /** @type {((inputs: User_Account_Revoke_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Account_Revoke_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_account_revoke_description(inputs)
	return __fr.user_account_revoke_description(inputs)
});
/**
* | output |
* | --- |
* | "Could not revoke this account." |
*
* @param {User_Account_Revoke_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_account_revoke_error = /** @type {((inputs?: User_Account_Revoke_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Account_Revoke_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_account_revoke_error(inputs)
	return __fr.user_account_revoke_error(inputs)
});
/**
* | output |
* | --- |
* | "Only sign-in method" |
*
* @param {User_Account_Only_MethodInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_account_only_method = /** @type {((inputs?: User_Account_Only_MethodInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Account_Only_MethodInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_account_only_method(inputs)
	return __fr.user_account_only_method(inputs)
});
/**
* | output |
* | --- |
* | "Cancel" |
*
* @param {User_Account_CancelInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_account_cancel = /** @type {((inputs?: User_Account_CancelInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Account_CancelInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_account_cancel(inputs)
	return __fr.user_account_cancel(inputs)
});
/**
* | output |
* | --- |
* | "Password" |
*
* @param {User_Account_Password_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_account_password_title = /** @type {((inputs?: User_Account_Password_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Account_Password_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_account_password_title(inputs)
	return __fr.user_account_password_title(inputs)
});
/**
* | output |
* | --- |
* | "Use an email and password as a sign-in option." |
*
* @param {User_Account_Password_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_account_password_description = /** @type {((inputs?: User_Account_Password_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Account_Password_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_account_password_description(inputs)
	return __fr.user_account_password_description(inputs)
});
/**
* | output |
* | --- |
* | "Password sign-in is enabled for this account." |
*
* @param {User_Account_Password_Connected_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_account_password_connected_description = /** @type {((inputs?: User_Account_Password_Connected_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Account_Password_Connected_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_account_password_connected_description(inputs)
	return __fr.user_account_password_connected_description(inputs)
});
/**
* | output |
* | --- |
* | "Set password" |
*
* @param {User_Account_Password_SetInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_account_password_set = /** @type {((inputs?: User_Account_Password_SetInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Account_Password_SetInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_account_password_set(inputs)
	return __fr.user_account_password_set(inputs)
});
/**
* | output |
* | --- |
* | "New password" |
*
* @param {User_Account_New_PasswordInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_account_new_password = /** @type {((inputs?: User_Account_New_PasswordInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Account_New_PasswordInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_account_new_password(inputs)
	return __fr.user_account_new_password(inputs)
});
/**
* | output |
* | --- |
* | "Could not set your password." |
*
* @param {User_Account_Password_Set_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_account_password_set_error = /** @type {((inputs?: User_Account_Password_Set_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Account_Password_Set_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_account_password_set_error(inputs)
	return __fr.user_account_password_set_error(inputs)
});
/**
* | output |
* | --- |
* | "Could not verify your password." |
*
* @param {User_Account_Password_Verify_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_account_password_verify_error = /** @type {((inputs?: User_Account_Password_Verify_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Account_Password_Verify_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_account_password_verify_error(inputs)
	return __fr.user_account_password_verify_error(inputs)
});
/**
* | output |
* | --- |
* | "Change password" |
*
* @param {User_Account_Password_Change_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_account_password_change_title = /** @type {((inputs?: User_Account_Password_Change_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Account_Password_Change_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_account_password_change_title(inputs)
	return __fr.user_account_password_change_title(inputs)
});
/**
* | output |
* | --- |
* | "Update the password used to sign in with your email." |
*
* @param {User_Account_Password_Change_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_account_password_change_description = /** @type {((inputs?: User_Account_Password_Change_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Account_Password_Change_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_account_password_change_description(inputs)
	return __fr.user_account_password_change_description(inputs)
});
/**
* | output |
* | --- |
* | "Current password" |
*
* @param {User_Account_Current_PasswordInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_account_current_password = /** @type {((inputs?: User_Account_Current_PasswordInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Account_Current_PasswordInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_account_current_password(inputs)
	return __fr.user_account_current_password(inputs)
});
/**
* | output |
* | --- |
* | "Change password" |
*
* @param {User_Account_Password_Change_SubmitInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_account_password_change_submit = /** @type {((inputs?: User_Account_Password_Change_SubmitInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Account_Password_Change_SubmitInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_account_password_change_submit(inputs)
	return __fr.user_account_password_change_submit(inputs)
});
/**
* | output |
* | --- |
* | "Your password has been updated." |
*
* @param {User_Account_Password_Change_SuccessInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_account_password_change_success = /** @type {((inputs?: User_Account_Password_Change_SuccessInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Account_Password_Change_SuccessInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_account_password_change_success(inputs)
	return __fr.user_account_password_change_success(inputs)
});
/**
* | output |
* | --- |
* | "Could not change your password." |
*
* @param {User_Account_Password_Change_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_account_password_change_error = /** @type {((inputs?: User_Account_Password_Change_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Account_Password_Change_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_account_password_change_error(inputs)
	return __fr.user_account_password_change_error(inputs)
});
/**
* | output |
* | --- |
* | "Organizations" |
*
* @param {Organizations_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organizations_title = /** @type {((inputs?: Organizations_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organizations_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organizations_title(inputs)
	return __fr.organizations_title(inputs)
});
/**
* | output |
* | --- |
* | "Create, edit, and switch between organizations you belong to." |
*
* @param {Organizations_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organizations_description = /** @type {((inputs?: Organizations_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organizations_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organizations_description(inputs)
	return __fr.organizations_description(inputs)
});
/**
* | output |
* | --- |
* | "Create organization" |
*
* @param {Organization_Create_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_create_title = /** @type {((inputs?: Organization_Create_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Create_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_create_title(inputs)
	return __fr.organization_create_title(inputs)
});
/**
* | output |
* | --- |
* | "Create a workspace for team-based access." |
*
* @param {Organization_Create_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_create_description = /** @type {((inputs?: Organization_Create_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Create_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_create_description(inputs)
	return __fr.organization_create_description(inputs)
});
/**
* | output |
* | --- |
* | "Edit organization" |
*
* @param {Organization_Edit_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_edit_title = /** @type {((inputs?: Organization_Edit_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Edit_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_edit_title(inputs)
	return __fr.organization_edit_title(inputs)
});
/**
* | output |
* | --- |
* | "Update the active organization's name and slug." |
*
* @param {Organization_Edit_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_edit_description = /** @type {((inputs?: Organization_Edit_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Edit_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_edit_description(inputs)
	return __fr.organization_edit_description(inputs)
});
/**
* | output |
* | --- |
* | "Organization name" |
*
* @param {Organization_NameInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_name = /** @type {((inputs?: Organization_NameInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_NameInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_name(inputs)
	return __fr.organization_name(inputs)
});
/**
* | output |
* | --- |
* | "Organization slug" |
*
* @param {Organization_SlugInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_slug = /** @type {((inputs?: Organization_SlugInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_SlugInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_slug(inputs)
	return __fr.organization_slug(inputs)
});
/**
* | output |
* | --- |
* | "Leave blank to generate one from the name." |
*
* @param {Organization_Slug_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_slug_description = /** @type {((inputs?: Organization_Slug_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Slug_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_slug_description(inputs)
	return __fr.organization_slug_description(inputs)
});
/**
* | output |
* | --- |
* | "Could not create the organization." |
*
* @param {Organization_Create_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_create_error = /** @type {((inputs?: Organization_Create_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Create_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_create_error(inputs)
	return __fr.organization_create_error(inputs)
});
/**
* | output |
* | --- |
* | "Could not update the organization." |
*
* @param {Organization_Update_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_update_error = /** @type {((inputs?: Organization_Update_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Update_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_update_error(inputs)
	return __fr.organization_update_error(inputs)
});
/**
* | output |
* | --- |
* | "You do not belong to any organizations yet." |
*
* @param {Organization_Switcher_EmptyInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_switcher_empty = /** @type {((inputs?: Organization_Switcher_EmptyInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Switcher_EmptyInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_switcher_empty(inputs)
	return __fr.organization_switcher_empty(inputs)
});
/**
* | output |
* | --- |
* | "No other organizations." |
*
* @param {Organization_Switcher_No_Other_OrganizationsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_switcher_no_other_organizations = /** @type {((inputs?: Organization_Switcher_No_Other_OrganizationsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Switcher_No_Other_OrganizationsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_switcher_no_other_organizations(inputs)
	return __fr.organization_switcher_no_other_organizations(inputs)
});
/**
* | output |
* | --- |
* | "Organization" |
*
* @param {Organization_Switcher_LabelInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_switcher_label = /** @type {((inputs?: Organization_Switcher_LabelInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Switcher_LabelInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_switcher_label(inputs)
	return __fr.organization_switcher_label(inputs)
});
/**
* | output |
* | --- |
* | "Manage organization" |
*
* @param {Organization_Switcher_ManageInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_switcher_manage = /** @type {((inputs?: Organization_Switcher_ManageInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Switcher_ManageInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_switcher_manage(inputs)
	return __fr.organization_switcher_manage(inputs)
});
/**
* | output |
* | --- |
* | "Loading..." |
*
* @param {Organization_LoadingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_loading = /** @type {((inputs?: Organization_LoadingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_LoadingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_loading(inputs)
	return __fr.organization_loading(inputs)
});