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