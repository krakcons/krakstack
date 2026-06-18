/* eslint-disable */
import { getLocale, experimentalStaticLocale } from "../runtime.js"

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */
/** @typedef {{}} Home_PageInputs */
/** @typedef {{}} About_PageInputs */
/** @typedef {{}} Example_MessageInputs */
/** @typedef {{}} Language_LabelInputs */
/** @typedef {{ locale: NonNullable<unknown> }} Current_LocaleInputs */
/** @typedef {{}} Learn_RouterInputs */
/** @typedef {{}} App_NameInputs */
/** @typedef {{}} Registry_Search_PlaceholderInputs */
/** @typedef {{}} Registry_Search_TitleInputs */
/** @typedef {{}} Registry_Search_DescriptionInputs */
/** @typedef {{}} Registry_Search_Input_PlaceholderInputs */
/** @typedef {{}} Registry_Search_EmptyInputs */
/** @typedef {{}} Api_Key_Rate_Limit_NoticeInputs */
/** @typedef {{}} Table_Clear_SearchInputs */
/** @typedef {{}} Home_EyebrowInputs */
/** @typedef {{}} Home_TitleInputs */
/** @typedef {{}} Home_DescriptionInputs */
/** @typedef {{}} View_DocsInputs */
/** @typedef {{}} Krakstack_Sites_HeadingInputs */
/** @typedef {{}} Krakstack_Packages_HeadingInputs */
/** @typedef {{}} Krakstack_Package_Npm_LinkInputs */
/** @typedef {{}} Krakstack_Package_Readme_LinkInputs */
/** @typedef {{}} Krakstack_Package_Install_HeadingInputs */
/** @typedef {{}} Krakstack_Package_Readme_HeadingInputs */
/** @typedef {{}} Krakstack_Package_Auth_TitleInputs */
/** @typedef {{}} Krakstack_Package_Auth_DescriptionInputs */
/** @typedef {{}} Krakstack_Package_Auth_BadgeInputs */
/** @typedef {{}} Krakstack_Package_Auth_Install_DescriptionInputs */
/** @typedef {{}} Krakstack_Site_Visit_LinkInputs */
/** @typedef {{}} Krakstack_Site_Github_LinkInputs */
/** @typedef {{}} Krakstack_Site_Features_HeadingInputs */
/** @typedef {{}} Krakstack_Site_Template_TitleInputs */
/** @typedef {{}} Krakstack_Site_Template_DescriptionInputs */
/** @typedef {{}} Krakstack_Site_Template_BadgeInputs */
/** @typedef {{}} Krakstack_Site_Template_OverviewInputs */
/** @typedef {{}} Krakstack_Site_Template_Feature_Start_TitleInputs */
/** @typedef {{}} Krakstack_Site_Template_Feature_StartInputs */
/** @typedef {{}} Krakstack_Site_Template_Feature_Effect_TitleInputs */
/** @typedef {{}} Krakstack_Site_Template_Feature_EffectInputs */
/** @typedef {{}} Krakstack_Site_Template_Feature_State_TitleInputs */
/** @typedef {{}} Krakstack_Site_Template_Feature_StateInputs */
/** @typedef {{}} Krakstack_Site_Template_Feature_I18n_TitleInputs */
/** @typedef {{}} Krakstack_Site_Template_Feature_I18nInputs */
/** @typedef {{}} Krakstack_Site_Auth_TitleInputs */
/** @typedef {{}} Krakstack_Site_Auth_DescriptionInputs */
/** @typedef {{}} Krakstack_Site_Auth_BadgeInputs */
/** @typedef {{}} Krakstack_Site_Auth_OverviewInputs */
/** @typedef {{}} Krakstack_Site_Auth_Feature_Oauth_TitleInputs */
/** @typedef {{}} Krakstack_Site_Auth_Feature_OauthInputs */
/** @typedef {{}} Krakstack_Site_Auth_Feature_Orgs_TitleInputs */
/** @typedef {{}} Krakstack_Site_Auth_Feature_OrgsInputs */
/** @typedef {{}} Krakstack_Site_Auth_Feature_Keys_TitleInputs */
/** @typedef {{}} Krakstack_Site_Auth_Feature_KeysInputs */
/** @typedef {{}} Krakstack_Site_Auth_Feature_Registry_TitleInputs */
/** @typedef {{}} Krakstack_Site_Auth_Feature_RegistryInputs */
/** @typedef {{}} Organization_Switcher_Preview_ExpandedInputs */
/** @typedef {{}} Organization_Switcher_Preview_CollapsedInputs */
/** @typedef {{}} User_Profile_Photo_Upload_LabelInputs */
/** @typedef {{}} User_Profile_Image_Upload_ErrorInputs */
/** @typedef {{}} User_Button_Aria_LabelInputs */
/** @typedef {{}} User_Button_AccountInputs */
/** @typedef {{}} User_Button_SecurityInputs */
/** @typedef {{}} User_Button_Api_KeysInputs */
/** @typedef {{}} User_Button_LogoutInputs */
/** @typedef {{}} User_Form_TitleInputs */
/** @typedef {{}} User_Form_DescriptionInputs */
/** @typedef {{}} User_Central_Auth_RequiredInputs */
/** @typedef {{}} User_Central_Auth_ReconnectInputs */
/** @typedef {{}} User_Central_Auth_Reconnect_ErrorInputs */
/** @typedef {{}} User_Profile_TitleInputs */
/** @typedef {{}} User_Profile_DescriptionInputs */
/** @typedef {{}} User_Profile_Photo_LabelInputs */
/** @typedef {{}} User_Form_Name_LabelInputs */
/** @typedef {{}} User_Form_Update_ErrorInputs */
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
/** @typedef {{}} User_Api_Key_PermissionsInputs */
/** @typedef {{}} User_Api_Key_Permissions_DescriptionInputs */
/** @typedef {{}} User_Api_Key_No_PermissionsInputs */
/** @typedef {{}} User_Api_Key_CopyInputs */
/** @typedef {{}} User_Api_Key_CopiedInputs */
/** @typedef {{}} User_Api_Keys_Export_File_NameInputs */
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
/** @typedef {{}} Organization_Translation_EnglishInputs */
/** @typedef {{}} Organization_Translation_FrenchInputs */
/** @typedef {{}} Organization_Translation_DescriptionInputs */
/** @typedef {{}} Organization_Translation_NameInputs */
/** @typedef {{}} Organization_Editing_LocaleInputs */
/** @typedef {{}} Organization_Locale_EnglishInputs */
/** @typedef {{}} Organization_Locale_FrenchInputs */
/** @typedef {{}} Organization_LogoInputs */
/** @typedef {{}} Organization_Logo_Upload_ErrorInputs */
/** @typedef {{}} Organization_Contact_EmailInputs */
/** @typedef {{}} Organization_LocationInputs */
/** @typedef {{}} Organization_Create_ErrorInputs */
/** @typedef {{}} Organization_Update_ErrorInputs */
/** @typedef {{}} Organization_Switcher_EmptyInputs */
/** @typedef {{}} Organization_Switcher_No_Other_OrganizationsInputs */
/** @typedef {{}} Organization_Switcher_LabelInputs */
/** @typedef {{}} Organization_Switcher_ManageInputs */
/** @typedef {{}} Organization_LoadingInputs */
/** @typedef {{}} Organization_Members_TitleInputs */
/** @typedef {{}} Organization_Members_HeadingInputs */
/** @typedef {{}} Organization_Members_DescriptionInputs */
/** @typedef {{}} Organization_Members_EmptyInputs */
/** @typedef {{}} Organization_Members_Load_ErrorInputs */
/** @typedef {{}} Organization_Member_UserInputs */
/** @typedef {{}} Organization_Member_EmailInputs */
/** @typedef {{}} Organization_Member_RoleInputs */
/** @typedef {{}} Organization_Member_JoinedInputs */
/** @typedef {{}} Organization_Member_RemoveInputs */
/** @typedef {{}} Organization_Member_Remove_ErrorInputs */
/** @typedef {{}} Organization_Member_Role_ErrorInputs */
/** @typedef {{}} Organization_Role_OwnerInputs */
/** @typedef {{}} Organization_Role_AdminInputs */
/** @typedef {{}} Organization_Role_MemberInputs */
/** @typedef {{}} Organization_Invite_Member_TitleInputs */
/** @typedef {{}} Organization_Invite_Member_DescriptionInputs */
/** @typedef {{}} Organization_Invite_ErrorInputs */
/** @typedef {{}} Organization_Invitations_HeadingInputs */
/** @typedef {{}} Organization_Invitations_DescriptionInputs */
/** @typedef {{}} Organization_Invitations_EmptyInputs */
/** @typedef {{}} Organization_Invitations_Load_ErrorInputs */
/** @typedef {{}} Organization_Invitation_StatusInputs */
/** @typedef {{}} Organization_Invitation_ExpiresInputs */
/** @typedef {{}} Organization_Invitation_CancelInputs */
/** @typedef {{}} Organization_Invitation_Cancel_ErrorInputs */
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
* | "Registry" |
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
* | "Search registry..." |
*
* @param {Registry_Search_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const registry_search_placeholder = /** @type {((inputs?: Registry_Search_PlaceholderInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Registry_Search_PlaceholderInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.registry_search_placeholder(inputs)
	return __fr.registry_search_placeholder(inputs)
});
/**
* | output |
* | --- |
* | "Registry search" |
*
* @param {Registry_Search_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const registry_search_title = /** @type {((inputs?: Registry_Search_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Registry_Search_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.registry_search_title(inputs)
	return __fr.registry_search_title(inputs)
});
/**
* | output |
* | --- |
* | "Search registry items and open their documentation." |
*
* @param {Registry_Search_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const registry_search_description = /** @type {((inputs?: Registry_Search_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Registry_Search_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.registry_search_description(inputs)
	return __fr.registry_search_description(inputs)
});
/**
* | output |
* | --- |
* | "Search registry items..." |
*
* @param {Registry_Search_Input_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const registry_search_input_placeholder = /** @type {((inputs?: Registry_Search_Input_PlaceholderInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Registry_Search_Input_PlaceholderInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.registry_search_input_placeholder(inputs)
	return __fr.registry_search_input_placeholder(inputs)
});
/**
* | output |
* | --- |
* | "No registry items found." |
*
* @param {Registry_Search_EmptyInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const registry_search_empty = /** @type {((inputs?: Registry_Search_EmptyInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Registry_Search_EmptyInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.registry_search_empty(inputs)
	return __fr.registry_search_empty(inputs)
});
/**
* | output |
* | --- |
* | "API keys are limited to 1,000 requests per day by default. Contact an admin to request changes." |
*
* @param {Api_Key_Rate_Limit_NoticeInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const api_key_rate_limit_notice = /** @type {((inputs?: Api_Key_Rate_Limit_NoticeInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Api_Key_Rate_Limit_NoticeInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.api_key_rate_limit_notice(inputs)
	return __fr.api_key_rate_limit_notice(inputs)
});
/**
* | output |
* | --- |
* | "Clear search" |
*
* @param {Table_Clear_SearchInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const table_clear_search = /** @type {((inputs?: Table_Clear_SearchInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Table_Clear_SearchInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.table_clear_search(inputs)
	return __fr.table_clear_search(inputs)
});
/**
* | output |
* | --- |
* | "Open Source" |
*
* @param {Home_EyebrowInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_eyebrow = /** @type {((inputs?: Home_EyebrowInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_EyebrowInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_eyebrow(inputs)
	return __fr.home_eyebrow(inputs)
});
/**
* | output |
* | --- |
* | "Components & services for your stack" |
*
* @param {Home_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_title = /** @type {((inputs?: Home_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_title(inputs)
	return __fr.home_title(inputs)
});
/**
* | output |
* | --- |
* | "Production-ready blocks and libraries you can add to your app with shadcn. Built with TanStack, Effect, and Drizzle." |
*
* @param {Home_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_description = /** @type {((inputs?: Home_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_description(inputs)
	return __fr.home_description(inputs)
});
/**
* | output |
* | --- |
* | "View docs →" |
*
* @param {View_DocsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const view_docs = /** @type {((inputs?: View_DocsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<View_DocsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.view_docs(inputs)
	return __fr.view_docs(inputs)
});
/**
* | output |
* | --- |
* | "KrakStack sites" |
*
* @param {Krakstack_Sites_HeadingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_sites_heading = /** @type {((inputs?: Krakstack_Sites_HeadingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Sites_HeadingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_sites_heading(inputs)
	return __fr.krakstack_sites_heading(inputs)
});
/**
* | output |
* | --- |
* | "Packages" |
*
* @param {Krakstack_Packages_HeadingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_packages_heading = /** @type {((inputs?: Krakstack_Packages_HeadingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Packages_HeadingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_packages_heading(inputs)
	return __fr.krakstack_packages_heading(inputs)
});
/**
* | output |
* | --- |
* | "View on npm" |
*
* @param {Krakstack_Package_Npm_LinkInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_package_npm_link = /** @type {((inputs?: Krakstack_Package_Npm_LinkInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Package_Npm_LinkInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_package_npm_link(inputs)
	return __fr.krakstack_package_npm_link(inputs)
});
/**
* | output |
* | --- |
* | "Open README" |
*
* @param {Krakstack_Package_Readme_LinkInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_package_readme_link = /** @type {((inputs?: Krakstack_Package_Readme_LinkInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Package_Readme_LinkInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_package_readme_link(inputs)
	return __fr.krakstack_package_readme_link(inputs)
});
/**
* | output |
* | --- |
* | "Installation" |
*
* @param {Krakstack_Package_Install_HeadingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_package_install_heading = /** @type {((inputs?: Krakstack_Package_Install_HeadingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Package_Install_HeadingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_package_install_heading(inputs)
	return __fr.krakstack_package_install_heading(inputs)
});
/**
* | output |
* | --- |
* | "README" |
*
* @param {Krakstack_Package_Readme_HeadingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_package_readme_heading = /** @type {((inputs?: Krakstack_Package_Readme_HeadingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Package_Readme_HeadingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_package_readme_heading(inputs)
	return __fr.krakstack_package_readme_heading(inputs)
});
/**
* | output |
* | --- |
* | "KrakStack Auth SDK" |
*
* @param {Krakstack_Package_Auth_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_package_auth_title = /** @type {((inputs?: Krakstack_Package_Auth_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Package_Auth_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_package_auth_title(inputs)
	return __fr.krakstack_package_auth_title(inputs)
});
/**
* | output |
* | --- |
* | "Typed Effect schemas and HttpApi clients for integrating applications and backend services with KrakStack Auth." |
*
* @param {Krakstack_Package_Auth_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_package_auth_description = /** @type {((inputs?: Krakstack_Package_Auth_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Package_Auth_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_package_auth_description(inputs)
	return __fr.krakstack_package_auth_description(inputs)
});
/**
* | output |
* | --- |
* | "npm package" |
*
* @param {Krakstack_Package_Auth_BadgeInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_package_auth_badge = /** @type {((inputs?: Krakstack_Package_Auth_BadgeInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Package_Auth_BadgeInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_package_auth_badge(inputs)
	return __fr.krakstack_package_auth_badge(inputs)
});
/**
* | output |
* | --- |
* | "Install the package with Effect to access the frontend, backend, and shared schema exports." |
*
* @param {Krakstack_Package_Auth_Install_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_package_auth_install_description = /** @type {((inputs?: Krakstack_Package_Auth_Install_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Package_Auth_Install_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_package_auth_install_description(inputs)
	return __fr.krakstack_package_auth_install_description(inputs)
});
/**
* | output |
* | --- |
* | "Open site" |
*
* @param {Krakstack_Site_Visit_LinkInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_site_visit_link = /** @type {((inputs?: Krakstack_Site_Visit_LinkInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Site_Visit_LinkInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_site_visit_link(inputs)
	return __fr.krakstack_site_visit_link(inputs)
});
/**
* | output |
* | --- |
* | "View GitHub" |
*
* @param {Krakstack_Site_Github_LinkInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_site_github_link = /** @type {((inputs?: Krakstack_Site_Github_LinkInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Site_Github_LinkInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_site_github_link(inputs)
	return __fr.krakstack_site_github_link(inputs)
});
/**
* | output |
* | --- |
* | "What it includes" |
*
* @param {Krakstack_Site_Features_HeadingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_site_features_heading = /** @type {((inputs?: Krakstack_Site_Features_HeadingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Site_Features_HeadingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_site_features_heading(inputs)
	return __fr.krakstack_site_features_heading(inputs)
});
/**
* | output |
* | --- |
* | "KrakStack Template" |
*
* @param {Krakstack_Site_Template_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_site_template_title = /** @type {((inputs?: Krakstack_Site_Template_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Site_Template_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_site_template_title(inputs)
	return __fr.krakstack_site_template_title(inputs)
});
/**
* | output |
* | --- |
* | "A live full-stack TanStack Start template showing the app patterns, UI blocks, Effect services, Drizzle database setup, i18n, and CRUD reference implementation." |
*
* @param {Krakstack_Site_Template_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_site_template_description = /** @type {((inputs?: Krakstack_Site_Template_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Site_Template_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_site_template_description(inputs)
	return __fr.krakstack_site_template_description(inputs)
});
/**
* | output |
* | --- |
* | "Template site" |
*
* @param {Krakstack_Site_Template_BadgeInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_site_template_badge = /** @type {((inputs?: Krakstack_Site_Template_BadgeInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Site_Template_BadgeInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_site_template_badge(inputs)
	return __fr.krakstack_site_template_badge(inputs)
});
/**
* | output |
* | --- |
* | "template.krakstack.net is the hosted preview of the KrakStack starter app. Use it to see how the template behaves before cloning the source or installing reg..." |
*
* @param {Krakstack_Site_Template_OverviewInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_site_template_overview = /** @type {((inputs?: Krakstack_Site_Template_OverviewInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Site_Template_OverviewInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_site_template_overview(inputs)
	return __fr.krakstack_site_template_overview(inputs)
});
/**
* | output |
* | --- |
* | "Application shell" |
*
* @param {Krakstack_Site_Template_Feature_Start_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_site_template_feature_start_title = /** @type {((inputs?: Krakstack_Site_Template_Feature_Start_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Site_Template_Feature_Start_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_site_template_feature_start_title(inputs)
	return __fr.krakstack_site_template_feature_start_title(inputs)
});
/**
* | output |
* | --- |
* | "TanStack Start routing and server rendering in a working application shell." |
*
* @param {Krakstack_Site_Template_Feature_StartInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_site_template_feature_start = /** @type {((inputs?: Krakstack_Site_Template_Feature_StartInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Site_Template_Feature_StartInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_site_template_feature_start(inputs)
	return __fr.krakstack_site_template_feature_start(inputs)
});
/**
* | output |
* | --- |
* | "Effect backend" |
*
* @param {Krakstack_Site_Template_Feature_Effect_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_site_template_feature_effect_title = /** @type {((inputs?: Krakstack_Site_Template_Feature_Effect_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Site_Template_Feature_Effect_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_site_template_feature_effect_title(inputs)
	return __fr.krakstack_site_template_feature_effect_title(inputs)
});
/**
* | output |
* | --- |
* | "Effect HTTP APIs, OpenAPI documentation, service layers, and Drizzle/PostgreSQL persistence." |
*
* @param {Krakstack_Site_Template_Feature_EffectInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_site_template_feature_effect = /** @type {((inputs?: Krakstack_Site_Template_Feature_EffectInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Site_Template_Feature_EffectInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_site_template_feature_effect(inputs)
	return __fr.krakstack_site_template_feature_effect(inputs)
});
/**
* | output |
* | --- |
* | "Product UI" |
*
* @param {Krakstack_Site_Template_Feature_State_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_site_template_feature_state_title = /** @type {((inputs?: Krakstack_Site_Template_Feature_State_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Site_Template_Feature_State_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_site_template_feature_state_title(inputs)
	return __fr.krakstack_site_template_feature_state_title(inputs)
});
/**
* | output |
* | --- |
* | "shadcn UI components, forms, tables, and optimistic Effect Atom client state." |
*
* @param {Krakstack_Site_Template_Feature_StateInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_site_template_feature_state = /** @type {((inputs?: Krakstack_Site_Template_Feature_StateInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Site_Template_Feature_StateInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_site_template_feature_state(inputs)
	return __fr.krakstack_site_template_feature_state(inputs)
});
/**
* | output |
* | --- |
* | "Localized routing" |
*
* @param {Krakstack_Site_Template_Feature_I18n_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_site_template_feature_i18n_title = /** @type {((inputs?: Krakstack_Site_Template_Feature_I18n_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Site_Template_Feature_I18n_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_site_template_feature_i18n_title(inputs)
	return __fr.krakstack_site_template_feature_i18n_title(inputs)
});
/**
* | output |
* | --- |
* | "Paraglide English/French i18n and localized routing patterns." |
*
* @param {Krakstack_Site_Template_Feature_I18nInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_site_template_feature_i18n = /** @type {((inputs?: Krakstack_Site_Template_Feature_I18nInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Site_Template_Feature_I18nInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_site_template_feature_i18n(inputs)
	return __fr.krakstack_site_template_feature_i18n(inputs)
});
/**
* | output |
* | --- |
* | "KrakStack Auth" |
*
* @param {Krakstack_Site_Auth_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_site_auth_title = /** @type {((inputs?: Krakstack_Site_Auth_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Site_Auth_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_site_auth_title(inputs)
	return __fr.krakstack_site_auth_title(inputs)
});
/**
* | output |
* | --- |
* | "The hosted identity and API-key service for KrakStack apps, providing OAuth sign-in, organization-aware sessions, and shared auth infrastructure." |
*
* @param {Krakstack_Site_Auth_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_site_auth_description = /** @type {((inputs?: Krakstack_Site_Auth_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Site_Auth_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_site_auth_description(inputs)
	return __fr.krakstack_site_auth_description(inputs)
});
/**
* | output |
* | --- |
* | "Auth service" |
*
* @param {Krakstack_Site_Auth_BadgeInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_site_auth_badge = /** @type {((inputs?: Krakstack_Site_Auth_BadgeInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Site_Auth_BadgeInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_site_auth_badge(inputs)
	return __fr.krakstack_site_auth_badge(inputs)
});
/**
* | output |
* | --- |
* | "auth.krakstack.net is the central authentication service used by KrakStack projects. It gives apps a shared identity provider and API-key verification surfac..." |
*
* @param {Krakstack_Site_Auth_OverviewInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_site_auth_overview = /** @type {((inputs?: Krakstack_Site_Auth_OverviewInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Site_Auth_OverviewInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_site_auth_overview(inputs)
	return __fr.krakstack_site_auth_overview(inputs)
});
/**
* | output |
* | --- |
* | "OAuth provider" |
*
* @param {Krakstack_Site_Auth_Feature_Oauth_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_site_auth_feature_oauth_title = /** @type {((inputs?: Krakstack_Site_Auth_Feature_Oauth_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Site_Auth_Feature_Oauth_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_site_auth_feature_oauth_title(inputs)
	return __fr.krakstack_site_auth_feature_oauth_title(inputs)
});
/**
* | output |
* | --- |
* | "OAuth sign-in for KrakStack applications and registry auth blocks." |
*
* @param {Krakstack_Site_Auth_Feature_OauthInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_site_auth_feature_oauth = /** @type {((inputs?: Krakstack_Site_Auth_Feature_OauthInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Site_Auth_Feature_OauthInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_site_auth_feature_oauth(inputs)
	return __fr.krakstack_site_auth_feature_oauth(inputs)
});
/**
* | output |
* | --- |
* | "Organizations" |
*
* @param {Krakstack_Site_Auth_Feature_Orgs_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_site_auth_feature_orgs_title = /** @type {((inputs?: Krakstack_Site_Auth_Feature_Orgs_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Site_Auth_Feature_Orgs_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_site_auth_feature_orgs_title(inputs)
	return __fr.krakstack_site_auth_feature_orgs_title(inputs)
});
/**
* | output |
* | --- |
* | "Organization-aware user sessions for apps that need team or tenant context." |
*
* @param {Krakstack_Site_Auth_Feature_OrgsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_site_auth_feature_orgs = /** @type {((inputs?: Krakstack_Site_Auth_Feature_OrgsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Site_Auth_Feature_OrgsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_site_auth_feature_orgs(inputs)
	return __fr.krakstack_site_auth_feature_orgs(inputs)
});
/**
* | output |
* | --- |
* | "API keys" |
*
* @param {Krakstack_Site_Auth_Feature_Keys_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_site_auth_feature_keys_title = /** @type {((inputs?: Krakstack_Site_Auth_Feature_Keys_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Site_Auth_Feature_Keys_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_site_auth_feature_keys_title(inputs)
	return __fr.krakstack_site_auth_feature_keys_title(inputs)
});
/**
* | output |
* | --- |
* | "API-key management and verification for service-to-service or external API access." |
*
* @param {Krakstack_Site_Auth_Feature_KeysInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_site_auth_feature_keys = /** @type {((inputs?: Krakstack_Site_Auth_Feature_KeysInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Site_Auth_Feature_KeysInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_site_auth_feature_keys(inputs)
	return __fr.krakstack_site_auth_feature_keys(inputs)
});
/**
* | output |
* | --- |
* | "Registry integration" |
*
* @param {Krakstack_Site_Auth_Feature_Registry_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_site_auth_feature_registry_title = /** @type {((inputs?: Krakstack_Site_Auth_Feature_Registry_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Site_Auth_Feature_Registry_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_site_auth_feature_registry_title(inputs)
	return __fr.krakstack_site_auth_feature_registry_title(inputs)
});
/**
* | output |
* | --- |
* | "Better Auth integration patterns used by the KrakStack auth, sign-in, sign-up, and user-button registry items." |
*
* @param {Krakstack_Site_Auth_Feature_RegistryInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const krakstack_site_auth_feature_registry = /** @type {((inputs?: Krakstack_Site_Auth_Feature_RegistryInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Krakstack_Site_Auth_Feature_RegistryInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.krakstack_site_auth_feature_registry(inputs)
	return __fr.krakstack_site_auth_feature_registry(inputs)
});
/**
* | output |
* | --- |
* | "Expanded" |
*
* @param {Organization_Switcher_Preview_ExpandedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_switcher_preview_expanded = /** @type {((inputs?: Organization_Switcher_Preview_ExpandedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Switcher_Preview_ExpandedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_switcher_preview_expanded(inputs)
	return __fr.organization_switcher_preview_expanded(inputs)
});
/**
* | output |
* | --- |
* | "Collapsed" |
*
* @param {Organization_Switcher_Preview_CollapsedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_switcher_preview_collapsed = /** @type {((inputs?: Organization_Switcher_Preview_CollapsedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Switcher_Preview_CollapsedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_switcher_preview_collapsed(inputs)
	return __fr.organization_switcher_preview_collapsed(inputs)
});
/**
* | output |
* | --- |
* | "Profile photo" |
*
* @param {User_Profile_Photo_Upload_LabelInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_profile_photo_upload_label = /** @type {((inputs?: User_Profile_Photo_Upload_LabelInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Profile_Photo_Upload_LabelInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_profile_photo_upload_label(inputs)
	return __fr.user_profile_photo_upload_label(inputs)
});
/**
* | output |
* | --- |
* | "Could not upload your profile photo." |
*
* @param {User_Profile_Image_Upload_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_profile_image_upload_error = /** @type {((inputs?: User_Profile_Image_Upload_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Profile_Image_Upload_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_profile_image_upload_error(inputs)
	return __fr.user_profile_image_upload_error(inputs)
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
* | "Permissions" |
*
* @param {User_Api_Key_PermissionsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_api_key_permissions = /** @type {((inputs?: User_Api_Key_PermissionsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Api_Key_PermissionsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_api_key_permissions(inputs)
	return __fr.user_api_key_permissions(inputs)
});
/**
* | output |
* | --- |
* | "Choose the permissions this API key should receive." |
*
* @param {User_Api_Key_Permissions_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_api_key_permissions_description = /** @type {((inputs?: User_Api_Key_Permissions_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Api_Key_Permissions_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_api_key_permissions_description(inputs)
	return __fr.user_api_key_permissions_description(inputs)
});
/**
* | output |
* | --- |
* | "No permissions" |
*
* @param {User_Api_Key_No_PermissionsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_api_key_no_permissions = /** @type {((inputs?: User_Api_Key_No_PermissionsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Api_Key_No_PermissionsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_api_key_no_permissions(inputs)
	return __fr.user_api_key_no_permissions(inputs)
});
/**
* | output |
* | --- |
* | "Copy" |
*
* @param {User_Api_Key_CopyInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_api_key_copy = /** @type {((inputs?: User_Api_Key_CopyInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Api_Key_CopyInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_api_key_copy(inputs)
	return __fr.user_api_key_copy(inputs)
});
/**
* | output |
* | --- |
* | "Copied" |
*
* @param {User_Api_Key_CopiedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_api_key_copied = /** @type {((inputs?: User_Api_Key_CopiedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Api_Key_CopiedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_api_key_copied(inputs)
	return __fr.user_api_key_copied(inputs)
});
/**
* | output |
* | --- |
* | "api-keys.csv" |
*
* @param {User_Api_Keys_Export_File_NameInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const user_api_keys_export_file_name = /** @type {((inputs?: User_Api_Keys_Export_File_NameInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<User_Api_Keys_Export_File_NameInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.user_api_keys_export_file_name(inputs)
	return __fr.user_api_keys_export_file_name(inputs)
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
* | "Update the active organization's canonical details and localized profile." |
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
* | "English profile" |
*
* @param {Organization_Translation_EnglishInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_translation_english = /** @type {((inputs?: Organization_Translation_EnglishInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Translation_EnglishInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_translation_english(inputs)
	return __fr.organization_translation_english(inputs)
});
/**
* | output |
* | --- |
* | "French profile" |
*
* @param {Organization_Translation_FrenchInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_translation_french = /** @type {((inputs?: Organization_Translation_FrenchInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Translation_FrenchInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_translation_french(inputs)
	return __fr.organization_translation_french(inputs)
});
/**
* | output |
* | --- |
* | "Localized organization details stored in metadata." |
*
* @param {Organization_Translation_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_translation_description = /** @type {((inputs?: Organization_Translation_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Translation_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_translation_description(inputs)
	return __fr.organization_translation_description(inputs)
});
/**
* | output |
* | --- |
* | "Localized name" |
*
* @param {Organization_Translation_NameInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_translation_name = /** @type {((inputs?: Organization_Translation_NameInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Translation_NameInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_translation_name(inputs)
	return __fr.organization_translation_name(inputs)
});
/**
* | output |
* | --- |
* | "Editing" |
*
* @param {Organization_Editing_LocaleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_editing_locale = /** @type {((inputs?: Organization_Editing_LocaleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Editing_LocaleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_editing_locale(inputs)
	return __fr.organization_editing_locale(inputs)
});
/**
* | output |
* | --- |
* | "English" |
*
* @param {Organization_Locale_EnglishInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_locale_english = /** @type {((inputs?: Organization_Locale_EnglishInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Locale_EnglishInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_locale_english(inputs)
	return __fr.organization_locale_english(inputs)
});
/**
* | output |
* | --- |
* | "French" |
*
* @param {Organization_Locale_FrenchInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_locale_french = /** @type {((inputs?: Organization_Locale_FrenchInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Locale_FrenchInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_locale_french(inputs)
	return __fr.organization_locale_french(inputs)
});
/**
* | output |
* | --- |
* | "Logo" |
*
* @param {Organization_LogoInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_logo = /** @type {((inputs?: Organization_LogoInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_LogoInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_logo(inputs)
	return __fr.organization_logo(inputs)
});
/**
* | output |
* | --- |
* | "Could not upload the organization logo." |
*
* @param {Organization_Logo_Upload_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_logo_upload_error = /** @type {((inputs?: Organization_Logo_Upload_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Logo_Upload_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_logo_upload_error(inputs)
	return __fr.organization_logo_upload_error(inputs)
});
/**
* | output |
* | --- |
* | "Contact email" |
*
* @param {Organization_Contact_EmailInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_contact_email = /** @type {((inputs?: Organization_Contact_EmailInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Contact_EmailInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_contact_email(inputs)
	return __fr.organization_contact_email(inputs)
});
/**
* | output |
* | --- |
* | "Location" |
*
* @param {Organization_LocationInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_location = /** @type {((inputs?: Organization_LocationInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_LocationInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_location(inputs)
	return __fr.organization_location(inputs)
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
/**
* | output |
* | --- |
* | "Members" |
*
* @param {Organization_Members_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_members_title = /** @type {((inputs?: Organization_Members_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Members_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_members_title(inputs)
	return __fr.organization_members_title(inputs)
});
/**
* | output |
* | --- |
* | "Organization members" |
*
* @param {Organization_Members_HeadingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_members_heading = /** @type {((inputs?: Organization_Members_HeadingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Members_HeadingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_members_heading(inputs)
	return __fr.organization_members_heading(inputs)
});
/**
* | output |
* | --- |
* | "Review active members, update roles, and remove access when needed." |
*
* @param {Organization_Members_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_members_description = /** @type {((inputs?: Organization_Members_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Members_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_members_description(inputs)
	return __fr.organization_members_description(inputs)
});
/**
* | output |
* | --- |
* | "No members found." |
*
* @param {Organization_Members_EmptyInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_members_empty = /** @type {((inputs?: Organization_Members_EmptyInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Members_EmptyInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_members_empty(inputs)
	return __fr.organization_members_empty(inputs)
});
/**
* | output |
* | --- |
* | "Could not load organization members." |
*
* @param {Organization_Members_Load_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_members_load_error = /** @type {((inputs?: Organization_Members_Load_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Members_Load_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_members_load_error(inputs)
	return __fr.organization_members_load_error(inputs)
});
/**
* | output |
* | --- |
* | "User" |
*
* @param {Organization_Member_UserInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_member_user = /** @type {((inputs?: Organization_Member_UserInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Member_UserInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_member_user(inputs)
	return __fr.organization_member_user(inputs)
});
/**
* | output |
* | --- |
* | "Email" |
*
* @param {Organization_Member_EmailInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_member_email = /** @type {((inputs?: Organization_Member_EmailInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Member_EmailInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_member_email(inputs)
	return __fr.organization_member_email(inputs)
});
/**
* | output |
* | --- |
* | "Role" |
*
* @param {Organization_Member_RoleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_member_role = /** @type {((inputs?: Organization_Member_RoleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Member_RoleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_member_role(inputs)
	return __fr.organization_member_role(inputs)
});
/**
* | output |
* | --- |
* | "Joined" |
*
* @param {Organization_Member_JoinedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_member_joined = /** @type {((inputs?: Organization_Member_JoinedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Member_JoinedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_member_joined(inputs)
	return __fr.organization_member_joined(inputs)
});
/**
* | output |
* | --- |
* | "Remove member" |
*
* @param {Organization_Member_RemoveInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_member_remove = /** @type {((inputs?: Organization_Member_RemoveInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Member_RemoveInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_member_remove(inputs)
	return __fr.organization_member_remove(inputs)
});
/**
* | output |
* | --- |
* | "Could not remove the member." |
*
* @param {Organization_Member_Remove_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_member_remove_error = /** @type {((inputs?: Organization_Member_Remove_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Member_Remove_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_member_remove_error(inputs)
	return __fr.organization_member_remove_error(inputs)
});
/**
* | output |
* | --- |
* | "Could not update the member role." |
*
* @param {Organization_Member_Role_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_member_role_error = /** @type {((inputs?: Organization_Member_Role_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Member_Role_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_member_role_error(inputs)
	return __fr.organization_member_role_error(inputs)
});
/**
* | output |
* | --- |
* | "Owner" |
*
* @param {Organization_Role_OwnerInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_role_owner = /** @type {((inputs?: Organization_Role_OwnerInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Role_OwnerInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_role_owner(inputs)
	return __fr.organization_role_owner(inputs)
});
/**
* | output |
* | --- |
* | "Admin" |
*
* @param {Organization_Role_AdminInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_role_admin = /** @type {((inputs?: Organization_Role_AdminInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Role_AdminInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_role_admin(inputs)
	return __fr.organization_role_admin(inputs)
});
/**
* | output |
* | --- |
* | "Member" |
*
* @param {Organization_Role_MemberInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_role_member = /** @type {((inputs?: Organization_Role_MemberInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Role_MemberInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_role_member(inputs)
	return __fr.organization_role_member(inputs)
});
/**
* | output |
* | --- |
* | "Invite a member" |
*
* @param {Organization_Invite_Member_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_invite_member_title = /** @type {((inputs?: Organization_Invite_Member_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Invite_Member_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_invite_member_title(inputs)
	return __fr.organization_invite_member_title(inputs)
});
/**
* | output |
* | --- |
* | "Send an invitation to join this organization with the selected role." |
*
* @param {Organization_Invite_Member_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_invite_member_description = /** @type {((inputs?: Organization_Invite_Member_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Invite_Member_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_invite_member_description(inputs)
	return __fr.organization_invite_member_description(inputs)
});
/**
* | output |
* | --- |
* | "Could not send the invitation." |
*
* @param {Organization_Invite_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_invite_error = /** @type {((inputs?: Organization_Invite_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Invite_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_invite_error(inputs)
	return __fr.organization_invite_error(inputs)
});
/**
* | output |
* | --- |
* | "Pending invitations" |
*
* @param {Organization_Invitations_HeadingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_invitations_heading = /** @type {((inputs?: Organization_Invitations_HeadingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Invitations_HeadingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_invitations_heading(inputs)
	return __fr.organization_invitations_heading(inputs)
});
/**
* | output |
* | --- |
* | "Track invitations that have not been accepted yet." |
*
* @param {Organization_Invitations_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_invitations_description = /** @type {((inputs?: Organization_Invitations_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Invitations_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_invitations_description(inputs)
	return __fr.organization_invitations_description(inputs)
});
/**
* | output |
* | --- |
* | "No pending invitations." |
*
* @param {Organization_Invitations_EmptyInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_invitations_empty = /** @type {((inputs?: Organization_Invitations_EmptyInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Invitations_EmptyInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_invitations_empty(inputs)
	return __fr.organization_invitations_empty(inputs)
});
/**
* | output |
* | --- |
* | "Could not load organization invitations." |
*
* @param {Organization_Invitations_Load_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_invitations_load_error = /** @type {((inputs?: Organization_Invitations_Load_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Invitations_Load_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_invitations_load_error(inputs)
	return __fr.organization_invitations_load_error(inputs)
});
/**
* | output |
* | --- |
* | "Status" |
*
* @param {Organization_Invitation_StatusInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_invitation_status = /** @type {((inputs?: Organization_Invitation_StatusInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Invitation_StatusInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_invitation_status(inputs)
	return __fr.organization_invitation_status(inputs)
});
/**
* | output |
* | --- |
* | "Expires" |
*
* @param {Organization_Invitation_ExpiresInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_invitation_expires = /** @type {((inputs?: Organization_Invitation_ExpiresInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Invitation_ExpiresInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_invitation_expires(inputs)
	return __fr.organization_invitation_expires(inputs)
});
/**
* | output |
* | --- |
* | "Cancel invitation" |
*
* @param {Organization_Invitation_CancelInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_invitation_cancel = /** @type {((inputs?: Organization_Invitation_CancelInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Invitation_CancelInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_invitation_cancel(inputs)
	return __fr.organization_invitation_cancel(inputs)
});
/**
* | output |
* | --- |
* | "Could not cancel the invitation." |
*
* @param {Organization_Invitation_Cancel_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const organization_invitation_cancel_error = /** @type {((inputs?: Organization_Invitation_Cancel_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Organization_Invitation_Cancel_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.organization_invitation_cancel_error(inputs)
	return __fr.organization_invitation_cancel_error(inputs)
});