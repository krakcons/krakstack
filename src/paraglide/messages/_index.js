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
/** @typedef {{}} Registry_NewInputs */
/** @typedef {{ date: NonNullable<unknown> }} Registry_Last_UpdatedInputs */
/** @typedef {{}} Table_Clear_SearchInputs */
/** @typedef {{}} Home_EyebrowInputs */
/** @typedef {{}} Home_TitleInputs */
/** @typedef {{}} Home_DescriptionInputs */
/** @typedef {{}} Home_Nav_DocsInputs */
/** @typedef {{}} Home_MenuInputs */
/** @typedef {{}} Home_Github_LabelInputs */
/** @typedef {{}} Home_Browse_RegistryInputs */
/** @typedef {{}} Home_View_GithubInputs */
/** @typedef {{}} Home_Open_Source_NoteInputs */
/** @typedef {{}} Home_Preview_TitleInputs */
/** @typedef {{}} Home_Preview_DescriptionInputs */
/** @typedef {{}} Home_Preview_BadgeInputs */
/** @typedef {{}} Home_Preview_ComponentInputs */
/** @typedef {{}} Home_Preview_ServiceInputs */
/** @typedef {{}} Home_Preview_AgentInputs */
/** @typedef {{}} Home_Preview_TemplateInputs */
/** @typedef {{}} Home_Preview_ReadyInputs */
/** @typedef {{}} Home_Capabilities_EyebrowInputs */
/** @typedef {{}} Home_Capabilities_TitleInputs */
/** @typedef {{}} Home_Capabilities_DescriptionInputs */
/** @typedef {{}} Home_Capability_Install_TitleInputs */
/** @typedef {{}} Home_Capability_Install_DescriptionInputs */
/** @typedef {{}} Home_Capability_Stack_TitleInputs */
/** @typedef {{}} Home_Capability_Stack_DescriptionInputs */
/** @typedef {{}} Home_Capability_Agents_TitleInputs */
/** @typedef {{}} Home_Capability_Agents_DescriptionInputs */
/** @typedef {{}} Home_Platform_EyebrowInputs */
/** @typedef {{}} Home_Platform_TitleInputs */
/** @typedef {{}} Home_Platform_Ui_TitleInputs */
/** @typedef {{}} Home_Platform_Ui_DescriptionInputs */
/** @typedef {{}} Home_Platform_Backend_TitleInputs */
/** @typedef {{}} Home_Platform_Backend_DescriptionInputs */
/** @typedef {{}} Home_Platform_Agents_TitleInputs */
/** @typedef {{}} Home_Platform_Agents_DescriptionInputs */
/** @typedef {{}} Home_Platform_Source_TitleInputs */
/** @typedef {{}} Home_Platform_Source_DescriptionInputs */
/** @typedef {{}} Home_Sites_DescriptionInputs */
/** @typedef {{}} Home_Cta_TitleInputs */
/** @typedef {{}} Home_Cta_DescriptionInputs */
/** @typedef {{}} Home_Get_StartedInputs */
/** @typedef {{}} Home_Stats_Components_TitleInputs */
/** @typedef {{}} Home_Stats_Components_DescriptionInputs */
/** @typedef {{}} Home_Stats_Services_TitleInputs */
/** @typedef {{}} Home_Stats_Services_DescriptionInputs */
/** @typedef {{}} Home_Stats_Total_TitleInputs */
/** @typedef {{}} Home_Stats_Total_DescriptionInputs */
/** @typedef {{}} View_DocsInputs */
/** @typedef {{}} Krakstack_Sites_HeadingInputs */
/** @typedef {{}} Home_Sites_TitleInputs */
/** @typedef {{}} Home_Catalogue_EyebrowInputs */
/** @typedef {{}} Home_Catalogue_TitleInputs */
/** @typedef {{}} Home_Catalogue_DescriptionInputs */
/** @typedef {{}} Home_Footer_NoteInputs */
/** @typedef {{}} Krakstack_Packages_HeadingInputs */
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
/** @typedef {{}} Pagination_Preview_TitleInputs */
/** @typedef {{}} Pagination_Preview_DescriptionInputs */
/** @typedef {{}} Pagination_Preview_FullInputs */
/** @typedef {{}} Pagination_Preview_CompactInputs */
/** @typedef {{}} File_Picker_Preview_Document_TitleInputs */
/** @typedef {{}} File_Picker_Preview_Document_DescriptionInputs */
/** @typedef {{}} File_Picker_Preview_Image_TitleInputs */
/** @typedef {{}} File_Picker_Preview_Image_DescriptionInputs */
/** @typedef {{}} File_Picker_Preview_Selected_Image_AltInputs */
/** @typedef {{}} File_Picker_Preview_Multiple_TitleInputs */
/** @typedef {{}} File_Picker_Preview_Multiple_DescriptionInputs */
/** @typedef {{ number: NonNullable<unknown> }} Virtualized_Combobox_Preview_CityInputs */
/** @typedef {{}} Virtualized_Combobox_Preview_Single_TitleInputs */
/** @typedef {{}} Virtualized_Combobox_Preview_DescriptionInputs */
/** @typedef {{}} Virtualized_Combobox_Preview_Single_LabelInputs */
/** @typedef {{}} Virtualized_Combobox_Preview_Single_PlaceholderInputs */
/** @typedef {{}} Virtualized_Combobox_Preview_EmptyInputs */
/** @typedef {{}} Virtualized_Combobox_Preview_Multiple_TitleInputs */
/** @typedef {{}} Virtualized_Combobox_Preview_Multiple_DescriptionInputs */
/** @typedef {{}} Virtualized_Combobox_Preview_Multiple_LabelInputs */
/** @typedef {{}} Virtualized_Combobox_Preview_Multiple_PlaceholderInputs */
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
* | "New" |
*
* @param {Registry_NewInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const registry_new = /** @type {((inputs?: Registry_NewInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Registry_NewInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.registry_new(inputs)
	return __fr.registry_new(inputs)
});
/**
* | output |
* | --- |
* | "Last updated {date}" |
*
* @param {Registry_Last_UpdatedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const registry_last_updated = /** @type {((inputs: Registry_Last_UpdatedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Registry_Last_UpdatedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.registry_last_updated(inputs)
	return __fr.registry_last_updated(inputs)
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
* | "The full-stack registry" |
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
* | "Ship the hard parts of your app" |
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
* | "Install production-ready UI, Effect services, and developer tooling with shadcn, or import the package directly. Own the code, keep your architecture, and mo..." |
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
* | "Documentation" |
*
* @param {Home_Nav_DocsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_nav_docs = /** @type {((inputs?: Home_Nav_DocsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Nav_DocsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_nav_docs(inputs)
	return __fr.home_nav_docs(inputs)
});
/**
* | output |
* | --- |
* | "Open menu" |
*
* @param {Home_MenuInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_menu = /** @type {((inputs?: Home_MenuInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_MenuInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_menu(inputs)
	return __fr.home_menu(inputs)
});
/**
* | output |
* | --- |
* | "Open Krakstack on Github" |
*
* @param {Home_Github_LabelInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_github_label = /** @type {((inputs?: Home_Github_LabelInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Github_LabelInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_github_label(inputs)
	return __fr.home_github_label(inputs)
});
/**
* | output |
* | --- |
* | "Browse the registry" |
*
* @param {Home_Browse_RegistryInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_browse_registry = /** @type {((inputs?: Home_Browse_RegistryInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Browse_RegistryInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_browse_registry(inputs)
	return __fr.home_browse_registry(inputs)
});
/**
* | output |
* | --- |
* | "Github" |
*
* @param {Home_View_GithubInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_view_github = /** @type {((inputs?: Home_View_GithubInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_View_GithubInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_view_github(inputs)
	return __fr.home_view_github(inputs)
});
/**
* | output |
* | --- |
* | "Open source, type-safe, and built to live in your codebase." |
*
* @param {Home_Open_Source_NoteInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_open_source_note = /** @type {((inputs?: Home_Open_Source_NoteInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Open_Source_NoteInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_open_source_note(inputs)
	return __fr.home_open_source_note(inputs)
});
/**
* | output |
* | --- |
* | "Add what your app needs" |
*
* @param {Home_Preview_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_preview_title = /** @type {((inputs?: Home_Preview_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Preview_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_preview_title(inputs)
	return __fr.home_preview_title(inputs)
});
/**
* | output |
* | --- |
* | "One command, source code included." |
*
* @param {Home_Preview_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_preview_description = /** @type {((inputs?: Home_Preview_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Preview_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_preview_description(inputs)
	return __fr.home_preview_description(inputs)
});
/**
* | output |
* | --- |
* | "Ready to install" |
*
* @param {Home_Preview_BadgeInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_preview_badge = /** @type {((inputs?: Home_Preview_BadgeInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Preview_BadgeInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_preview_badge(inputs)
	return __fr.home_preview_badge(inputs)
});
/**
* | output |
* | --- |
* | "UI components" |
*
* @param {Home_Preview_ComponentInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_preview_component = /** @type {((inputs?: Home_Preview_ComponentInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Preview_ComponentInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_preview_component(inputs)
	return __fr.home_preview_component(inputs)
});
/**
* | output |
* | --- |
* | "Effect services" |
*
* @param {Home_Preview_ServiceInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_preview_service = /** @type {((inputs?: Home_Preview_ServiceInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Preview_ServiceInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_preview_service(inputs)
	return __fr.home_preview_service(inputs)
});
/**
* | output |
* | --- |
* | "Agent tooling" |
*
* @param {Home_Preview_AgentInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_preview_agent = /** @type {((inputs?: Home_Preview_AgentInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Preview_AgentInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_preview_agent(inputs)
	return __fr.home_preview_agent(inputs)
});
/**
* | output |
* | --- |
* | "App patterns" |
*
* @param {Home_Preview_TemplateInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_preview_template = /** @type {((inputs?: Home_Preview_TemplateInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Preview_TemplateInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_preview_template(inputs)
	return __fr.home_preview_template(inputs)
});
/**
* | output |
* | --- |
* | "Your code, ready to adapt" |
*
* @param {Home_Preview_ReadyInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_preview_ready = /** @type {((inputs?: Home_Preview_ReadyInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Preview_ReadyInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_preview_ready(inputs)
	return __fr.home_preview_ready(inputs)
});
/**
* | output |
* | --- |
* | "Built for real applications" |
*
* @param {Home_Capabilities_EyebrowInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_capabilities_eyebrow = /** @type {((inputs?: Home_Capabilities_EyebrowInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Capabilities_EyebrowInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_capabilities_eyebrow(inputs)
	return __fr.home_capabilities_eyebrow(inputs)
});
/**
* | output |
* | --- |
* | "A better starting point without another framework" |
*
* @param {Home_Capabilities_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_capabilities_title = /** @type {((inputs?: Home_Capabilities_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Capabilities_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_capabilities_title(inputs)
	return __fr.home_capabilities_title(inputs)
});
/**
* | output |
* | --- |
* | "Use focused building blocks instead of rebuilding the same application surface for every project." |
*
* @param {Home_Capabilities_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_capabilities_description = /** @type {((inputs?: Home_Capabilities_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Capabilities_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_capabilities_description(inputs)
	return __fr.home_capabilities_description(inputs)
});
/**
* | output |
* | --- |
* | "Use it your way" |
*
* @param {Home_Capability_Install_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_capability_install_title = /** @type {((inputs?: Home_Capability_Install_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Capability_Install_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_capability_install_title(inputs)
	return __fr.home_capability_install_title(inputs)
});
/**
* | output |
* | --- |
* | "Install focused components and services through shadcn, import the package directly, or review every line and change anything." |
*
* @param {Home_Capability_Install_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_capability_install_description = /** @type {((inputs?: Home_Capability_Install_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Capability_Install_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_capability_install_description(inputs)
	return __fr.home_capability_install_description(inputs)
});
/**
* | output |
* | --- |
* | "Keep one architecture" |
*
* @param {Home_Capability_Stack_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_capability_stack_title = /** @type {((inputs?: Home_Capability_Stack_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Capability_Stack_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_capability_stack_title(inputs)
	return __fr.home_capability_stack_title(inputs)
});
/**
* | output |
* | --- |
* | "Use coherent TanStack, Effect, Drizzle, and shadcn patterns across the browser, API, and database." |
*
* @param {Home_Capability_Stack_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_capability_stack_description = /** @type {((inputs?: Home_Capability_Stack_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Capability_Stack_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_capability_stack_description(inputs)
	return __fr.home_capability_stack_description(inputs)
});
/**
* | output |
* | --- |
* | "Build with agents" |
*
* @param {Home_Capability_Agents_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_capability_agents_title = /** @type {((inputs?: Home_Capability_Agents_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Capability_Agents_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_capability_agents_title(inputs)
	return __fr.home_capability_agents_title(inputs)
});
/**
* | output |
* | --- |
* | "Give coding agents documented patterns, MCP-enabled APIs, and reusable building blocks they can work with safely." |
*
* @param {Home_Capability_Agents_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_capability_agents_description = /** @type {((inputs?: Home_Capability_Agents_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Capability_Agents_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_capability_agents_description(inputs)
	return __fr.home_capability_agents_description(inputs)
});
/**
* | output |
* | --- |
* | "One coherent platform" |
*
* @param {Home_Platform_EyebrowInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_platform_eyebrow = /** @type {((inputs?: Home_Platform_EyebrowInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Platform_EyebrowInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_platform_eyebrow(inputs)
	return __fr.home_platform_eyebrow(inputs)
});
/**
* | output |
* | --- |
* | "The pieces stay aligned from interface to infrastructure." |
*
* @param {Home_Platform_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_platform_title = /** @type {((inputs?: Home_Platform_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Platform_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_platform_title(inputs)
	return __fr.home_platform_title(inputs)
});
/**
* | output |
* | --- |
* | "Product UI" |
*
* @param {Home_Platform_Ui_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_platform_ui_title = /** @type {((inputs?: Home_Platform_Ui_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Platform_Ui_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_platform_ui_title(inputs)
	return __fr.home_platform_ui_title(inputs)
});
/**
* | output |
* | --- |
* | "Accessible shadcn components, forms, tables, previews, and layouts ready to shape into your product." |
*
* @param {Home_Platform_Ui_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_platform_ui_description = /** @type {((inputs?: Home_Platform_Ui_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Platform_Ui_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_platform_ui_description(inputs)
	return __fr.home_platform_ui_description(inputs)
});
/**
* | output |
* | --- |
* | "Effect backend" |
*
* @param {Home_Platform_Backend_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_platform_backend_title = /** @type {((inputs?: Home_Platform_Backend_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Platform_Backend_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_platform_backend_title(inputs)
	return __fr.home_platform_backend_title(inputs)
});
/**
* | output |
* | --- |
* | "Typed services, HTTP APIs, OpenAPI metadata, persistence, and observability patterns that belong together." |
*
* @param {Home_Platform_Backend_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_platform_backend_description = /** @type {((inputs?: Home_Platform_Backend_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Platform_Backend_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_platform_backend_description(inputs)
	return __fr.home_platform_backend_description(inputs)
});
/**
* | output |
* | --- |
* | "Agent-ready patterns" |
*
* @param {Home_Platform_Agents_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_platform_agents_title = /** @type {((inputs?: Home_Platform_Agents_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Platform_Agents_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_platform_agents_title(inputs)
	return __fr.home_platform_agents_title(inputs)
});
/**
* | output |
* | --- |
* | "Documentation, MCP, CLI, and AI helpers give your team and coding agents a shared vocabulary." |
*
* @param {Home_Platform_Agents_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_platform_agents_description = /** @type {((inputs?: Home_Platform_Agents_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Platform_Agents_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_platform_agents_description(inputs)
	return __fr.home_platform_agents_description(inputs)
});
/**
* | output |
* | --- |
* | "Package or source" |
*
* @param {Home_Platform_Source_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_platform_source_title = /** @type {((inputs?: Home_Platform_Source_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Platform_Source_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_platform_source_title(inputs)
	return __fr.home_platform_source_title(inputs)
});
/**
* | output |
* | --- |
* | "Import the package for a fast start or copy registry source when you want full ownership. Either way, the architecture stays visible and yours to extend." |
*
* @param {Home_Platform_Source_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_platform_source_description = /** @type {((inputs?: Home_Platform_Source_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Platform_Source_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_platform_source_description(inputs)
	return __fr.home_platform_source_description(inputs)
});
/**
* | output |
* | --- |
* | "See the same patterns composed into a working application, then use the registry to bring only what you need into your own codebase." |
*
* @param {Home_Sites_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_sites_description = /** @type {((inputs?: Home_Sites_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Sites_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_sites_description(inputs)
	return __fr.home_sites_description(inputs)
});
/**
* | output |
* | --- |
* | "Start with the architecture, finish with your product." |
*
* @param {Home_Cta_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_cta_title = /** @type {((inputs?: Home_Cta_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Cta_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_cta_title(inputs)
	return __fr.home_cta_title(inputs)
});
/**
* | output |
* | --- |
* | "Browse the introduction, install a focused block or import the package, and keep moving with code you can inspect and adapt." |
*
* @param {Home_Cta_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_cta_description = /** @type {((inputs?: Home_Cta_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Cta_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_cta_description(inputs)
	return __fr.home_cta_description(inputs)
});
/**
* | output |
* | --- |
* | "Get started" |
*
* @param {Home_Get_StartedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_get_started = /** @type {((inputs?: Home_Get_StartedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Get_StartedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_get_started(inputs)
	return __fr.home_get_started(inputs)
});
/**
* | output |
* | --- |
* | "Components" |
*
* @param {Home_Stats_Components_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_stats_components_title = /** @type {((inputs?: Home_Stats_Components_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Stats_Components_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_stats_components_title(inputs)
	return __fr.home_stats_components_title(inputs)
});
/**
* | output |
* | --- |
* | "Registry UI blocks ready to install with shadcn." |
*
* @param {Home_Stats_Components_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_stats_components_description = /** @type {((inputs?: Home_Stats_Components_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Stats_Components_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_stats_components_description(inputs)
	return __fr.home_stats_components_description(inputs)
});
/**
* | output |
* | --- |
* | "Services" |
*
* @param {Home_Stats_Services_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_stats_services_title = /** @type {((inputs?: Home_Stats_Services_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Stats_Services_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_stats_services_title(inputs)
	return __fr.home_stats_services_title(inputs)
});
/**
* | output |
* | --- |
* | "Backend and infrastructure registry entries." |
*
* @param {Home_Stats_Services_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_stats_services_description = /** @type {((inputs?: Home_Stats_Services_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Stats_Services_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_stats_services_description(inputs)
	return __fr.home_stats_services_description(inputs)
});
/**
* | output |
* | --- |
* | "Total registry items" |
*
* @param {Home_Stats_Total_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_stats_total_title = /** @type {((inputs?: Home_Stats_Total_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Stats_Total_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_stats_total_title(inputs)
	return __fr.home_stats_total_title(inputs)
});
/**
* | output |
* | --- |
* | "Components, services, libraries, and configuration starters." |
*
* @param {Home_Stats_Total_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_stats_total_description = /** @type {((inputs?: Home_Stats_Total_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Stats_Total_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_stats_total_description(inputs)
	return __fr.home_stats_total_description(inputs)
});
/**
* | output |
* | --- |
* | "View docs" |
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
* | "See the stack working together" |
*
* @param {Home_Sites_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_sites_title = /** @type {((inputs?: Home_Sites_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Sites_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_sites_title(inputs)
	return __fr.home_sites_title(inputs)
});
/**
* | output |
* | --- |
* | "Explore the registry" |
*
* @param {Home_Catalogue_EyebrowInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_catalogue_eyebrow = /** @type {((inputs?: Home_Catalogue_EyebrowInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Catalogue_EyebrowInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_catalogue_eyebrow(inputs)
	return __fr.home_catalogue_eyebrow(inputs)
});
/**
* | output |
* | --- |
* | "Start with a block. Keep building from there." |
*
* @param {Home_Catalogue_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_catalogue_title = /** @type {((inputs?: Home_Catalogue_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Catalogue_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_catalogue_title(inputs)
	return __fr.home_catalogue_title(inputs)
});
/**
* | output |
* | --- |
* | "Choose only what your application needs. Every registry item includes source, dependencies, usage guidance, and a path to customization." |
*
* @param {Home_Catalogue_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_catalogue_description = /** @type {((inputs?: Home_Catalogue_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Catalogue_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_catalogue_description(inputs)
	return __fr.home_catalogue_description(inputs)
});
/**
* | output |
* | --- |
* | "Open-source building blocks for ambitious TanStack apps." |
*
* @param {Home_Footer_NoteInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_footer_note = /** @type {((inputs?: Home_Footer_NoteInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Footer_NoteInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_footer_note(inputs)
	return __fr.home_footer_note(inputs)
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
* | "Pagination" |
*
* @param {Pagination_Preview_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const pagination_preview_title = /** @type {((inputs?: Pagination_Preview_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pagination_Preview_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.pagination_preview_title(inputs)
	return __fr.pagination_preview_title(inputs)
});
/**
* | output |
* | --- |
* | "Controlled page navigation with page-size selection, result summaries, and responsive layouts." |
*
* @param {Pagination_Preview_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const pagination_preview_description = /** @type {((inputs?: Pagination_Preview_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pagination_Preview_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.pagination_preview_description(inputs)
	return __fr.pagination_preview_description(inputs)
});
/**
* | output |
* | --- |
* | "Full layout" |
*
* @param {Pagination_Preview_FullInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const pagination_preview_full = /** @type {((inputs?: Pagination_Preview_FullInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pagination_Preview_FullInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.pagination_preview_full(inputs)
	return __fr.pagination_preview_full(inputs)
});
/**
* | output |
* | --- |
* | "Compact layout" |
*
* @param {Pagination_Preview_CompactInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const pagination_preview_compact = /** @type {((inputs?: Pagination_Preview_CompactInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pagination_Preview_CompactInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.pagination_preview_compact(inputs)
	return __fr.pagination_preview_compact(inputs)
});
/**
* | output |
* | --- |
* | "Document" |
*
* @param {File_Picker_Preview_Document_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const file_picker_preview_document_title = /** @type {((inputs?: File_Picker_Preview_Document_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<File_Picker_Preview_Document_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.file_picker_preview_document_title(inputs)
	return __fr.file_picker_preview_document_title(inputs)
});
/**
* | output |
* | --- |
* | "Drop a PDF or text file, or open the native file dialog." |
*
* @param {File_Picker_Preview_Document_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const file_picker_preview_document_description = /** @type {((inputs?: File_Picker_Preview_Document_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<File_Picker_Preview_Document_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.file_picker_preview_document_description(inputs)
	return __fr.file_picker_preview_document_description(inputs)
});
/**
* | output |
* | --- |
* | "Image" |
*
* @param {File_Picker_Preview_Image_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const file_picker_preview_image_title = /** @type {((inputs?: File_Picker_Preview_Image_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<File_Picker_Preview_Image_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.file_picker_preview_image_title(inputs)
	return __fr.file_picker_preview_image_title(inputs)
});
/**
* | output |
* | --- |
* | "Selected images use a managed local preview URL." |
*
* @param {File_Picker_Preview_Image_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const file_picker_preview_image_description = /** @type {((inputs?: File_Picker_Preview_Image_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<File_Picker_Preview_Image_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.file_picker_preview_image_description(inputs)
	return __fr.file_picker_preview_image_description(inputs)
});
/**
* | output |
* | --- |
* | "Selected image" |
*
* @param {File_Picker_Preview_Selected_Image_AltInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const file_picker_preview_selected_image_alt = /** @type {((inputs?: File_Picker_Preview_Selected_Image_AltInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<File_Picker_Preview_Selected_Image_AltInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.file_picker_preview_selected_image_alt(inputs)
	return __fr.file_picker_preview_selected_image_alt(inputs)
});
/**
* | output |
* | --- |
* | "Multiple files" |
*
* @param {File_Picker_Preview_Multiple_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const file_picker_preview_multiple_title = /** @type {((inputs?: File_Picker_Preview_Multiple_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<File_Picker_Preview_Multiple_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.file_picker_preview_multiple_title(inputs)
	return __fr.file_picker_preview_multiple_title(inputs)
});
/**
* | output |
* | --- |
* | "Choose several documents at once or add more files to the current selection." |
*
* @param {File_Picker_Preview_Multiple_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const file_picker_preview_multiple_description = /** @type {((inputs?: File_Picker_Preview_Multiple_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<File_Picker_Preview_Multiple_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.file_picker_preview_multiple_description(inputs)
	return __fr.file_picker_preview_multiple_description(inputs)
});
/**
* | output |
* | --- |
* | "City {number}" |
*
* @param {Virtualized_Combobox_Preview_CityInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const virtualized_combobox_preview_city = /** @type {((inputs: Virtualized_Combobox_Preview_CityInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Virtualized_Combobox_Preview_CityInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.virtualized_combobox_preview_city(inputs)
	return __fr.virtualized_combobox_preview_city(inputs)
});
/**
* | output |
* | --- |
* | "Single selection" |
*
* @param {Virtualized_Combobox_Preview_Single_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const virtualized_combobox_preview_single_title = /** @type {((inputs?: Virtualized_Combobox_Preview_Single_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Virtualized_Combobox_Preview_Single_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.virtualized_combobox_preview_single_title(inputs)
	return __fr.virtualized_combobox_preview_single_title(inputs)
});
/**
* | output |
* | --- |
* | "Search 1,000 options while only rendering the visible rows." |
*
* @param {Virtualized_Combobox_Preview_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const virtualized_combobox_preview_description = /** @type {((inputs?: Virtualized_Combobox_Preview_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Virtualized_Combobox_Preview_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.virtualized_combobox_preview_description(inputs)
	return __fr.virtualized_combobox_preview_description(inputs)
});
/**
* | output |
* | --- |
* | "Select a city" |
*
* @param {Virtualized_Combobox_Preview_Single_LabelInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const virtualized_combobox_preview_single_label = /** @type {((inputs?: Virtualized_Combobox_Preview_Single_LabelInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Virtualized_Combobox_Preview_Single_LabelInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.virtualized_combobox_preview_single_label(inputs)
	return __fr.virtualized_combobox_preview_single_label(inputs)
});
/**
* | output |
* | --- |
* | "Select a city" |
*
* @param {Virtualized_Combobox_Preview_Single_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const virtualized_combobox_preview_single_placeholder = /** @type {((inputs?: Virtualized_Combobox_Preview_Single_PlaceholderInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Virtualized_Combobox_Preview_Single_PlaceholderInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.virtualized_combobox_preview_single_placeholder(inputs)
	return __fr.virtualized_combobox_preview_single_placeholder(inputs)
});
/**
* | output |
* | --- |
* | "No cities found." |
*
* @param {Virtualized_Combobox_Preview_EmptyInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const virtualized_combobox_preview_empty = /** @type {((inputs?: Virtualized_Combobox_Preview_EmptyInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Virtualized_Combobox_Preview_EmptyInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.virtualized_combobox_preview_empty(inputs)
	return __fr.virtualized_combobox_preview_empty(inputs)
});
/**
* | output |
* | --- |
* | "Multiple selection" |
*
* @param {Virtualized_Combobox_Preview_Multiple_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const virtualized_combobox_preview_multiple_title = /** @type {((inputs?: Virtualized_Combobox_Preview_Multiple_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Virtualized_Combobox_Preview_Multiple_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.virtualized_combobox_preview_multiple_title(inputs)
	return __fr.virtualized_combobox_preview_multiple_title(inputs)
});
/**
* | output |
* | --- |
* | "Select several cities and clear the entire selection at once." |
*
* @param {Virtualized_Combobox_Preview_Multiple_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const virtualized_combobox_preview_multiple_description = /** @type {((inputs?: Virtualized_Combobox_Preview_Multiple_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Virtualized_Combobox_Preview_Multiple_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.virtualized_combobox_preview_multiple_description(inputs)
	return __fr.virtualized_combobox_preview_multiple_description(inputs)
});
/**
* | output |
* | --- |
* | "Select cities" |
*
* @param {Virtualized_Combobox_Preview_Multiple_LabelInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const virtualized_combobox_preview_multiple_label = /** @type {((inputs?: Virtualized_Combobox_Preview_Multiple_LabelInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Virtualized_Combobox_Preview_Multiple_LabelInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.virtualized_combobox_preview_multiple_label(inputs)
	return __fr.virtualized_combobox_preview_multiple_label(inputs)
});
/**
* | output |
* | --- |
* | "Select cities" |
*
* @param {Virtualized_Combobox_Preview_Multiple_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const virtualized_combobox_preview_multiple_placeholder = /** @type {((inputs?: Virtualized_Combobox_Preview_Multiple_PlaceholderInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Virtualized_Combobox_Preview_Multiple_PlaceholderInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.virtualized_combobox_preview_multiple_placeholder(inputs)
	return __fr.virtualized_combobox_preview_multiple_placeholder(inputs)
});