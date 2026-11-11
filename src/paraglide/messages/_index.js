/* eslint-disable */
import { getLocale, experimentalStaticLocale } from "../runtime.js"

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */
/** @typedef {{}} Cron_Example_HourlyInputs */
/** @typedef {{}} Cron_Example_DailyInputs */
/** @typedef {{}} Cron_Example_WeekdaysInputs */
/** @typedef {{}} Cron_Examples_HelpInputs */
/** @typedef {{}} New_Components_TimezoneInputs */
/** @typedef {{}} New_Components_Timezone_HelpInputs */
/** @typedef {{}} New_Components_CropInputs */
/** @typedef {{}} New_Components_Crop_ResultInputs */
/** @typedef {{}} Interactions_Reorder_HelpInputs */
/** @typedef {{}} Interactions_Simulate_FailureInputs */
/** @typedef {{}} Interactions_Run_ActionInputs */
/** @typedef {{}} Interactions_Local_OnlyInputs */
/** @typedef {{}} Interactions_Delete_ExampleInputs */
/** @typedef {{}} Interactions_Delete_TitleInputs */
/** @typedef {{}} Interactions_Delete_DescriptionInputs */
/** @typedef {{}} Interactions_Deleted_ExampleInputs */
/** @typedef {{}} Interactions_Project_NameInputs */
/** @typedef {{}} Interactions_Edit_HelpInputs */
/** @typedef {{}} Interactions_Save_LocallyInputs */
/** @typedef {{}} Interactions_Try_LeavingInputs */
/** @typedef {{}} Interactions_UnsavedInputs */
/** @typedef {{}} Interactions_SavedInputs */
/** @typedef {{}} Interactions_Guard_HelpInputs */
/** @typedef {{}} Interactions_Toggle_ContentInputs */
/** @typedef {{}} Interactions_Presence_ContentInputs */
/** @typedef {{}} Interactions_Motion_HelpInputs */
/** @typedef {{}} Interactions_Resize_ContentInputs */
/** @typedef {{}} Interactions_Height_SummaryInputs */
/** @typedef {{}} Interactions_Height_DetailsInputs */
/** @typedef {{}} Interactions_Add_ItemInputs */
/** @typedef {{}} Interactions_Reverse_ItemsInputs */
/** @typedef {{}} Interactions_Example_ListInputs */
/** @typedef {{ count: NonNullable<unknown> }} Interactions_ItemInputs */
/** @typedef {{ count: NonNullable<unknown> }} Interactions_Remove_ItemInputs */
/** @typedef {{}} Interactions_RemoveInputs */
/** @typedef {{}} Interactions_Example_TotalInputs */
/** @typedef {{}} Interactions_IncreaseInputs */
/** @typedef {{}} Interactions_ResetInputs */
/** @typedef {{}} Registry_Docs_ExampleInputs */
/** @typedef {{}} Registry_Docs_PreviewInputs */
/** @typedef {{}} Registry_Docs_CodeInputs */
/** @typedef {{}} Registry_Docs_DependenciesInputs */
/** @typedef {{}} Registry_Docs_Dev_DependenciesInputs */
/** @typedef {{}} Registry_Docs_Registry_DependenciesInputs */
/** @typedef {{}} Registry_Docs_Dependencies_DescriptionInputs */
/** @typedef {{}} New_Components_Switcher_HelpInputs */
/** @typedef {{}} New_Components_LearningInputs */
/** @typedef {{}} New_Components_Learning_DescriptionInputs */
/** @typedef {{}} New_Components_CoursesInputs */
/** @typedef {{}} New_Components_Courses_DescriptionInputs */
/** @typedef {{}} New_Components_SimulatorInputs */
/** @typedef {{}} New_Components_Example_KeyInputs */
/** @typedef {{}} New_Components_Disabled_KeyInputs */
/** @typedef {{}} New_Components_Secret_HelpInputs */
/** @typedef {{}} New_Components_RecipientsInputs */
/** @typedef {{ count: NonNullable<unknown>, duplicates: NonNullable<unknown> }} New_Components_List_SummaryInputs */
/** @typedef {{}} New_Components_List_HelpInputs */
/** @typedef {{}} New_Components_EmailInputs */
/** @typedef {{}} New_Components_Email_DescriptionInputs */
/** @typedef {{}} New_Components_MessageInputs */
/** @typedef {{}} New_Components_Message_DescriptionInputs */
/** @typedef {{}} New_Components_Primary_ChannelInputs */
/** @typedef {{}} New_Components_ChannelsInputs */
/** @typedef {{}} New_Components_Upload_ProgressInputs */
/** @typedef {{}} New_Components_Upload_ProcessingInputs */
/** @typedef {{}} New_Components_Upload_DoneInputs */
/** @typedef {{}} New_Components_Upload_ErrorInputs */
/** @typedef {{}} New_Components_Upload_FailureInputs */
/** @typedef {{}} New_Components_Upload_HelpInputs */
/** @typedef {{}} Map_Picker_Preview_TitleInputs */
/** @typedef {{}} Map_Picker_Preview_DescriptionInputs */
/** @typedef {{}} Map_Menu_Preview_PointInputs */
/** @typedef {{ place: NonNullable<unknown> }} Map_Menu_Preview_Selected_PointInputs */
/** @typedef {{}} Map_Menu_Preview_Inline_TitleInputs */
/** @typedef {{}} Map_Menu_Preview_Inline_DescriptionInputs */
/** @typedef {{}} Map_Picker_Preview_KeyInputs */
/** @typedef {{}} Map_Picker_Preview_Key_PlaceholderInputs */
/** @typedef {{}} Map_Picker_Preview_OpenInputs */
/** @typedef {{ place: NonNullable<unknown>, distance: NonNullable<unknown> }} Map_Picker_Preview_SelectedInputs */
/** @typedef {{}} Stepper_Preview_TitleInputs */
/** @typedef {{}} Stepper_Preview_DescriptionInputs */
/** @typedef {{}} Stepper_Preview_ConnectInputs */
/** @typedef {{}} Stepper_Preview_ConfigureInputs */
/** @typedef {{}} Stepper_Preview_VerifyInputs */
/** @typedef {{}} Stepper_Preview_ContentInputs */
/** @typedef {{}} Stepper_Preview_PreviousInputs */
/** @typedef {{}} Stepper_Preview_ContinueInputs */
/** @typedef {{}} Stepper_Preview_RestartInputs */
/** @typedef {{}} Stepper_Example_DetailsInputs */
/** @typedef {{}} Stepper_Example_ReviewInputs */
/** @typedef {{}} Stepper_Example_DoneInputs */
/** @typedef {{}} Stepper_Example_Form_TitleInputs */
/** @typedef {{}} Stepper_Example_Form_DescriptionInputs */
/** @typedef {{}} Stepper_Example_NameInputs */
/** @typedef {{}} Stepper_Example_ConfirmInputs */
/** @typedef {{}} Stepper_Example_FinishedInputs */
/** @typedef {{}} Stepper_Example_Vertical_TitleInputs */
/** @typedef {{}} Stepper_Example_Vertical_DescriptionInputs */
/** @typedef {{}} Stepper_Example_ConnectedInputs */
/** @typedef {{}} Stepper_Example_AttentionInputs */
/** @typedef {{}} Stepper_Example_WaitingInputs */
/** @typedef {{}} Notifications_Staff_TitleInputs */
/** @typedef {{}} Notifications_Staff_DescriptionInputs */
/** @typedef {{}} Notifications_Staff_SourceInputs */
/** @typedef {{}} Notifications_Staff_AllInputs */
/** @typedef {{}} Notifications_Staff_ContactsInputs */
/** @typedef {{}} Notifications_Staff_EngineInputs */
/** @typedef {{}} Notifications_Staff_AccountInputs */
/** @typedef {{}} Notifications_Staff_OrganizationInputs */
/** @typedef {{}} Notifications_Staff_WorkspaceInputs */
/** @typedef {{}} Notifications_Staff_TemplateInputs */
/** @typedef {{}} Notifications_Staff_TransactionalInputs */
/** @typedef {{}} Notifications_Staff_NotificationInputs */
/** @typedef {{}} Notifications_Staff_MarketingInputs */
/** @typedef {{}} Notifications_Staff_EventInputs */
/** @typedef {{}} Notifications_Staff_ReferencesInputs */
/** @typedef {{}} Notifications_Staff_Feedback_NoticeInputs */
/** @typedef {{}} Notifications_Staff_Feedback_CoveredInputs */
/** @typedef {{}} Notifications_Staff_Feedback_UnavailableInputs */
/** @typedef {{}} Kraksend_Ops_Contact_HistoryInputs */
/** @typedef {{}} Kraksend_Ops_SourceInputs */
/** @typedef {{}} Kraksend_Ops_Notice_VersionInputs */
/** @typedef {{}} Kraksend_Ops_LocaleInputs */
/** @typedef {{}} Kraksend_Ops_TitleInputs */
/** @typedef {{}} Kraksend_Ops_DescriptionInputs */
/** @typedef {{}} Kraksend_Ops_OverviewInputs */
/** @typedef {{}} Kraksend_Ops_ActivityInputs */
/** @typedef {{}} Kraksend_Ops_FeedbackInputs */
/** @typedef {{}} Kraksend_Ops_SuppressionsInputs */
/** @typedef {{}} Kraksend_Ops_AuditInputs */
/** @typedef {{}} Kraksend_Ops_RecipientsInputs */
/** @typedef {{}} Kraksend_Ops_RefreshInputs */
/** @typedef {{}} Kraksend_Ops_EmptyInputs */
/** @typedef {{}} Kraksend_Ops_SearchInputs */
/** @typedef {{}} Kraksend_Ops_SinceInputs */
/** @typedef {{}} Kraksend_Ops_UntilInputs */
/** @typedef {{}} Kraksend_Ops_ApplyInputs */
/** @typedef {{}} Kraksend_Ops_AllInputs */
/** @typedef {{}} Kraksend_Ops_TotalInputs */
/** @typedef {{}} Kraksend_Ops_QueuedInputs */
/** @typedef {{}} Kraksend_Ops_ProcessingInputs */
/** @typedef {{}} Kraksend_Ops_RetryingInputs */
/** @typedef {{}} Kraksend_Ops_Soft_BouncedInputs */
/** @typedef {{}} Kraksend_Ops_Pending_FeedbackInputs */
/** @typedef {{}} Kraksend_Ops_Active_SuppressionsInputs */
/** @typedef {{}} Kraksend_Ops_BouncesInputs */
/** @typedef {{}} Kraksend_Ops_CampaignInputs */
/** @typedef {{}} Kraksend_Ops_Campaign_IdInputs */
/** @typedef {{}} Kraksend_Ops_ProviderInputs */
/** @typedef {{}} Kraksend_Ops_Provider_Message_IdInputs */
/** @typedef {{}} Kraksend_Ops_AttemptsInputs */
/** @typedef {{}} Kraksend_Ops_CreatedInputs */
/** @typedef {{}} Kraksend_Ops_ScheduledInputs */
/** @typedef {{}} Kraksend_Ops_UpdatedInputs */
/** @typedef {{}} Kraksend_Ops_ReasonInputs */
/** @typedef {{}} Kraksend_Ops_InspectInputs */
/** @typedef {{}} Kraksend_Ops_CorrelationInputs */
/** @typedef {{}} Kraksend_Ops_PendingInputs */
/** @typedef {{}} Kraksend_Ops_AppliedInputs */
/** @typedef {{}} Kraksend_Ops_OccurredInputs */
/** @typedef {{}} Kraksend_Ops_ReceivedInputs */
/** @typedef {{}} Kraksend_Ops_CheckedInputs */
/** @typedef {{}} Kraksend_Ops_Event_IdInputs */
/** @typedef {{}} Kraksend_Ops_Delivery_IdInputs */
/** @typedef {{}} Kraksend_Ops_Contact_IdInputs */
/** @typedef {{}} Kraksend_Ops_Add_SuppressionInputs */
/** @typedef {{}} Kraksend_Ops_Remove_SuppressionInputs */
/** @typedef {{}} Kraksend_Ops_Suppression_WarningInputs */
/** @typedef {{}} Kraksend_Ops_ConfirmInputs */
/** @typedef {{}} Kraksend_Ops_ActiveInputs */
/** @typedef {{}} Kraksend_Ops_ExpiredInputs */
/** @typedef {{}} Kraksend_Ops_ExpiresInputs */
/** @typedef {{}} Kraksend_Ops_NeverInputs */
/** @typedef {{}} Kraksend_Ops_PurposeInputs */
/** @typedef {{}} Kraksend_Ops_ActorInputs */
/** @typedef {{}} Kraksend_Ops_ActionInputs */
/** @typedef {{}} Kraksend_Ops_AddInputs */
/** @typedef {{}} Kraksend_Ops_RemoveInputs */
/** @typedef {{}} Kraksend_Ops_Previous_ReasonInputs */
/** @typedef {{}} Kraksend_Ops_Request_IdInputs */
/** @typedef {{}} Kraksend_Ops_Recipients_HintInputs */
/** @typedef {{}} Kraksend_Ops_GenerationInputs */
/** @typedef {{}} Kraksend_Ops_OutcomeInputs */
/** @typedef {{}} Kraksend_Ops_StartedInputs */
/** @typedef {{}} Kraksend_Ops_CompletedInputs */
/** @typedef {{}} Kraksend_Ops_IdInputs */
/** @typedef {{}} Kraksend_Ops_Outcome_RetryInputs */
/** @typedef {{}} Kraksend_Ops_Outcome_PermanentInputs */
/** @typedef {{}} Kraksend_Ops_Outcome_UnavailableInputs */
/** @typedef {{}} Kraksend_Ops_Outcome_SkippedInputs */
/** @typedef {{}} Kraksend_Ops_FailedInputs */
/** @typedef {{}} Kraksend_Campaign_CloseInputs */
/** @typedef {{}} Kraksend_Campaign_StatusInputs */
/** @typedef {{}} Kraksend_Campaign_TitleInputs */
/** @typedef {{}} Kraksend_Campaign_DescriptionInputs */
/** @typedef {{}} Kraksend_Campaign_CreateInputs */
/** @typedef {{}} Kraksend_Campaign_FromInputs */
/** @typedef {{}} Kraksend_Campaign_SubjectInputs */
/** @typedef {{}} Kraksend_Campaign_TextInputs */
/** @typedef {{}} Kraksend_Campaign_ManageInputs */
/** @typedef {{}} Kraksend_Campaign_ScheduleInputs */
/** @typedef {{}} Kraksend_Campaign_Scheduled_ForInputs */
/** @typedef {{}} Kraksend_Campaign_PauseInputs */
/** @typedef {{}} Kraksend_Campaign_ResumeInputs */
/** @typedef {{}} Kraksend_Campaign_CancelInputs */
/** @typedef {{}} Kraksend_Campaign_Confirm_CancelInputs */
/** @typedef {{}} Kraksend_Campaign_Cancel_DescriptionInputs */
/** @typedef {{}} Kraksend_Campaign_EmptyInputs */
/** @typedef {{}} Kraksend_Campaign_ReportingInputs */
/** @typedef {{}} Kraksend_Campaign_DraftInputs */
/** @typedef {{}} Kraksend_Campaign_ScheduledInputs */
/** @typedef {{}} Kraksend_Campaign_RunningInputs */
/** @typedef {{}} Kraksend_Campaign_PausedInputs */
/** @typedef {{}} Kraksend_Campaign_CancelledInputs */
/** @typedef {{}} Kraksend_Campaign_CompletedInputs */
/** @typedef {{}} Kraksend_Campaign_AudienceInputs */
/** @typedef {{}} Kraksend_Campaign_PendingInputs */
/** @typedef {{}} Kraksend_Campaign_PublishedInputs */
/** @typedef {{}} Kraksend_Campaign_SkippedInputs */
/** @typedef {{}} Kraksend_Campaign_AcceptedInputs */
/** @typedef {{}} Kraksend_Campaign_FailedInputs */
/** @typedef {{}} Kraksend_Campaign_SuppressedInputs */
/** @typedef {{}} Kraksend_Campaign_ConfirmedInputs */
/** @typedef {{}} Kraksend_Campaign_Hard_BouncedInputs */
/** @typedef {{}} Kraksend_Campaign_ComplainedInputs */
/** @typedef {{}} Kraksend_Campaign_EnglishInputs */
/** @typedef {{}} Kraksend_Campaign_FrenchInputs */
/** @typedef {{}} Kraksend_Unsubscribe_TitleInputs */
/** @typedef {{}} Kraksend_Unsubscribe_DescriptionInputs */
/** @typedef {{}} Kraksend_Unsubscribe_InvalidInputs */
/** @typedef {{}} Kraksend_Unsubscribe_UnavailableInputs */
/** @typedef {{}} Kraksend_Unsubscribe_SuccessInputs */
/** @typedef {{}} Kraksend_Contacts_TitleInputs */
/** @typedef {{}} Kraksend_Contacts_DescriptionInputs */
/** @typedef {{}} Kraksend_Contacts_CreateInputs */
/** @typedef {{}} Kraksend_Contacts_NameInputs */
/** @typedef {{}} Kraksend_Contacts_EmailInputs */
/** @typedef {{}} Kraksend_Contacts_ConsentInputs */
/** @typedef {{}} Kraksend_Contacts_UnknownInputs */
/** @typedef {{}} Kraksend_Contacts_SubscribedInputs */
/** @typedef {{}} Kraksend_Contacts_UnsubscribedInputs */
/** @typedef {{}} Kraksend_Contacts_WithdrawInputs */
/** @typedef {{}} Kraksend_Contacts_SaveInputs */
/** @typedef {{}} Kraksend_Contacts_FailedInputs */
/** @typedef {{}} Kraksend_Contacts_LoadingInputs */
/** @typedef {{}} Kraksend_Contacts_EmptyInputs */
/** @typedef {{}} Kraksend_Contacts_PreviousInputs */
/** @typedef {{}} Kraksend_Contacts_NextInputs */
/** @typedef {{}} Color_Picker_Preview_TitleInputs */
/** @typedef {{}} Color_Picker_Preview_DescriptionInputs */
/** @typedef {{}} Color_Picker_Preview_DisabledInputs */
/** @typedef {{}} Notification_Unsubscribe_TitleInputs */
/** @typedef {{}} Notification_Unsubscribe_DescriptionInputs */
/** @typedef {{}} Notification_Unsubscribe_ActionInputs */
/** @typedef {{}} Notification_Unsubscribe_SuccessInputs */
/** @typedef {{}} Notification_Unsubscribe_InvalidInputs */
/** @typedef {{}} Notification_Unsubscribe_UnavailableInputs */
/** @typedef {{}} Notification_Unsubscribe_FooterInputs */
/** @typedef {{}} Agent_Preview_Demo_DescriptionInputs */
/** @typedef {{ scenario: NonNullable<unknown> }} Agent_Preview_Demo_PromptInputs */
/** @typedef {{}} Agent_Preview_ChatInputs */
/** @typedef {{}} Agent_Preview_ToolsInputs */
/** @typedef {{}} Agent_Preview_ApprovalInputs */
/** @typedef {{}} Agent_Preview_DestructiveInputs */
/** @typedef {{}} Agent_Preview_FailureInputs */
/** @typedef {{}} Agent_Preview_ErrorInputs */
/** @typedef {{}} Agent_Preview_MarkdownInputs */
/** @typedef {{}} Agent_Preview_Tool_DescriptionInputs */
/** @typedef {{}} Agent_Preview_Search_ToolInputs */
/** @typedef {{}} Agent_Preview_Read_ToolInputs */
/** @typedef {{}} Agent_Preview_Update_ToolInputs */
/** @typedef {{}} Agent_Preview_Delete_ToolInputs */
/** @typedef {{}} Agent_Preview_Tools_ResponseInputs */
/** @typedef {{}} Agent_Preview_Tool_Failure_ResponseInputs */
/** @typedef {{}} Agent_Preview_Approved_ResponseInputs */
/** @typedef {{}} Agent_Preview_Denied_ResponseInputs */
/** @typedef {{}} Agent_Preview_Markdown_ResponseInputs */
/** @typedef {{}} Agent_Preview_Markdown_ItemInputs */
/** @typedef {{}} Agent_Preview_Response_IntroInputs */
/** @typedef {{}} Agent_Preview_Response_PlanInputs */
/** @typedef {{}} Agent_Preview_Response_FollowupInputs */
/** @typedef {{ references: NonNullable<unknown> }} Agent_Preview_Response_ReferencesInputs */
/** @typedef {{}} Effect_Form_Preview_Image_LabelInputs */
/** @typedef {{}} Data_Table_Preview_TrueInputs */
/** @typedef {{}} Data_Table_Preview_FalseInputs */
/** @typedef {{}} Data_Table_Preview_ShippedInputs */
/** @typedef {{ row: NonNullable<unknown> }} Data_Table_Preview_Toggle_BooleanInputs */
/** @typedef {{}} Data_Table_Preview_Kitchen_SinkInputs */
/** @typedef {{}} Data_Table_Preview_Kitchen_Sink_DescriptionInputs */
/** @typedef {{}} Data_Table_Preview_Column_TypesInputs */
/** @typedef {{}} Data_Table_Preview_Column_Types_DescriptionInputs */
/** @typedef {{}} Data_Table_Preview_No_ItemsInputs */
/** @typedef {{}} Data_Table_Preview_Manage_MembersInputs */
/** @typedef {{}} Data_Table_Preview_Member_ActionsInputs */
/** @typedef {{}} Data_Table_Preview_UserInputs */
/** @typedef {{}} Data_Table_Preview_ImpersonateInputs */
/** @typedef {{}} Data_Table_Preview_BanInputs */
/** @typedef {{ action: NonNullable<unknown>, name: NonNullable<unknown>, row: NonNullable<unknown> }} Data_Table_Preview_Member_Action_StatusInputs */
/** @typedef {{}} Data_Table_Preview_List_IconsInputs */
/** @typedef {{}} Data_Table_Preview_List_EditableInputs */
/** @typedef {{}} Data_Table_Preview_MembersInputs */
/** @typedef {{}} Data_Table_Preview_Updated_AtInputs */
/** @typedef {{}} Error_Preview_TitleInputs */
/** @typedef {{}} Error_Preview_DescriptionInputs */
/** @typedef {{}} Error_Preview_MessageInputs */
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
/** @typedef {{}} Home_Repositories_EyebrowInputs */
/** @typedef {{}} Home_Repositories_TitleInputs */
/** @typedef {{}} Home_Repositories_DescriptionInputs */
/** @typedef {{}} Home_Repository_Template_TitleInputs */
/** @typedef {{}} Home_Repository_Template_DescriptionInputs */
/** @typedef {{}} Home_Repository_Auth_TitleInputs */
/** @typedef {{}} Home_Repository_Auth_DescriptionInputs */
/** @typedef {{}} Home_Repository_Uptime_TitleInputs */
/** @typedef {{}} Home_Repository_Uptime_DescriptionInputs */
/** @typedef {{}} Home_Repository_ViewInputs */
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
* | "Every hour" |
*
* @param {Cron_Example_HourlyInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const cron_example_hourly = /** @type {((inputs?: Cron_Example_HourlyInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Cron_Example_HourlyInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.cron_example_hourly(inputs)
	return __fr.cron_example_hourly(inputs)
});
/**
* | output |
* | --- |
* | "Daily at 09:00" |
*
* @param {Cron_Example_DailyInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const cron_example_daily = /** @type {((inputs?: Cron_Example_DailyInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Cron_Example_DailyInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.cron_example_daily(inputs)
	return __fr.cron_example_daily(inputs)
});
/**
* | output |
* | --- |
* | "Weekdays at 09:00" |
*
* @param {Cron_Example_WeekdaysInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const cron_example_weekdays = /** @type {((inputs?: Cron_Example_WeekdaysInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Cron_Example_WeekdaysInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.cron_example_weekdays(inputs)
	return __fr.cron_example_weekdays(inputs)
});
/**
* | output |
* | --- |
* | "Try an example schedule. These buttons are part of this demo only." |
*
* @param {Cron_Examples_HelpInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const cron_examples_help = /** @type {((inputs?: Cron_Examples_HelpInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Cron_Examples_HelpInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.cron_examples_help(inputs)
	return __fr.cron_examples_help(inputs)
});
/**
* | output |
* | --- |
* | "Preferred time zone" |
*
* @param {New_Components_TimezoneInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_timezone = /** @type {((inputs?: New_Components_TimezoneInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_TimezoneInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_timezone(inputs)
	return __fr.new_components_timezone(inputs)
});
/**
* | output |
* | --- |
* | "This example shows North American time zones. Developers can configure another continent or all zones in code. Search a city, name or UTC offset; local times..." |
*
* @param {New_Components_Timezone_HelpInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_timezone_help = /** @type {((inputs?: New_Components_Timezone_HelpInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_Timezone_HelpInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_timezone_help(inputs)
	return __fr.new_components_timezone_help(inputs)
});
/**
* | output |
* | --- |
* | "Crop example image" |
*
* @param {New_Components_CropInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_crop = /** @type {((inputs?: New_Components_CropInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_CropInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_crop(inputs)
	return __fr.new_components_crop(inputs)
});
/**
* | output |
* | --- |
* | "Exported PNG preview" |
*
* @param {New_Components_Crop_ResultInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_crop_result = /** @type {((inputs?: New_Components_Crop_ResultInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_Crop_ResultInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_crop_result(inputs)
	return __fr.new_components_crop_result(inputs)
});
/**
* | output |
* | --- |
* | "Drag an item by its grip to change the order. You can also focus a grip and use Arrow Up, Arrow Down, Home or End. Changes stay local to this example." |
*
* @param {Interactions_Reorder_HelpInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_reorder_help = /** @type {((inputs?: Interactions_Reorder_HelpInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_Reorder_HelpInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_reorder_help(inputs)
	return __fr.interactions_reorder_help(inputs)
});
/**
* | output |
* | --- |
* | "Simulate a failed action" |
*
* @param {Interactions_Simulate_FailureInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_simulate_failure = /** @type {((inputs?: Interactions_Simulate_FailureInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_Simulate_FailureInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_simulate_failure(inputs)
	return __fr.interactions_simulate_failure(inputs)
});
/**
* | output |
* | --- |
* | "Run example action" |
*
* @param {Interactions_Run_ActionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_run_action = /** @type {((inputs?: Interactions_Run_ActionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_Run_ActionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_run_action(inputs)
	return __fr.interactions_run_action(inputs)
});
/**
* | output |
* | --- |
* | "Local demonstration only. No records are created, changed or deleted on a server." |
*
* @param {Interactions_Local_OnlyInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_local_only = /** @type {((inputs?: Interactions_Local_OnlyInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_Local_OnlyInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_local_only(inputs)
	return __fr.interactions_local_only(inputs)
});
/**
* | output |
* | --- |
* | "Delete example workspace" |
*
* @param {Interactions_Delete_ExampleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_delete_example = /** @type {((inputs?: Interactions_Delete_ExampleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_Delete_ExampleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_delete_example(inputs)
	return __fr.interactions_delete_example(inputs)
});
/**
* | output |
* | --- |
* | "Delete this example workspace?" |
*
* @param {Interactions_Delete_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_delete_title = /** @type {((inputs?: Interactions_Delete_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_Delete_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_delete_title(inputs)
	return __fr.interactions_delete_title(inputs)
});
/**
* | output |
* | --- |
* | "Type DELETE to try the confirmation flow. This example does not delete any real data." |
*
* @param {Interactions_Delete_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_delete_description = /** @type {((inputs?: Interactions_Delete_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_Delete_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_delete_description(inputs)
	return __fr.interactions_delete_description(inputs)
});
/**
* | output |
* | --- |
* | "Example action completed. No real data was deleted." |
*
* @param {Interactions_Deleted_ExampleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_deleted_example = /** @type {((inputs?: Interactions_Deleted_ExampleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_Deleted_ExampleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_deleted_example(inputs)
	return __fr.interactions_deleted_example(inputs)
});
/**
* | output |
* | --- |
* | "Project name" |
*
* @param {Interactions_Project_NameInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_project_name = /** @type {((inputs?: Interactions_Project_NameInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_Project_NameInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_project_name(inputs)
	return __fr.interactions_project_name(inputs)
});
/**
* | output |
* | --- |
* | "Edit the name, then save with Enter or cancel with Escape. Failed saves keep the draft. The example rejects blank names and stores nothing on a server." |
*
* @param {Interactions_Edit_HelpInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_edit_help = /** @type {((inputs?: Interactions_Edit_HelpInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_Edit_HelpInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_edit_help(inputs)
	return __fr.interactions_edit_help(inputs)
});
/**
* | output |
* | --- |
* | "Save example draft" |
*
* @param {Interactions_Save_LocallyInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_save_locally = /** @type {((inputs?: Interactions_Save_LocallyInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_Save_LocallyInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_save_locally(inputs)
	return __fr.interactions_save_locally(inputs)
});
/**
* | output |
* | --- |
* | "Try leaving this page" |
*
* @param {Interactions_Try_LeavingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_try_leaving = /** @type {((inputs?: Interactions_Try_LeavingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_Try_LeavingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_try_leaving(inputs)
	return __fr.interactions_try_leaving(inputs)
});
/**
* | output |
* | --- |
* | "Unsaved changes" |
*
* @param {Interactions_UnsavedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_unsaved = /** @type {((inputs?: Interactions_UnsavedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_UnsavedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_unsaved(inputs)
	return __fr.interactions_unsaved(inputs)
});
/**
* | output |
* | --- |
* | "No unsaved changes" |
*
* @param {Interactions_SavedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_saved = /** @type {((inputs?: Interactions_SavedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_SavedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_saved(inputs)
	return __fr.interactions_saved(inputs)
});
/**
* | output |
* | --- |
* | "Change the name, then follow the link or a sidebar item. Keep editing cancels navigation; Leave page discards this local draft. Browser-close protection is a..." |
*
* @param {Interactions_Guard_HelpInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_guard_help = /** @type {((inputs?: Interactions_Guard_HelpInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_Guard_HelpInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_guard_help(inputs)
	return __fr.interactions_guard_help(inputs)
});
/**
* | output |
* | --- |
* | "Toggle content" |
*
* @param {Interactions_Toggle_ContentInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_toggle_content = /** @type {((inputs?: Interactions_Toggle_ContentInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_Toggle_ContentInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_toggle_content(inputs)
	return __fr.interactions_toggle_content(inputs)
});
/**
* | output |
* | --- |
* | "This content stays visible during server rendering. Exiting content becomes inert immediately, then unmounts after its transition." |
*
* @param {Interactions_Presence_ContentInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_presence_content = /** @type {((inputs?: Interactions_Presence_ContentInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_Presence_ContentInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_presence_content(inputs)
	return __fr.interactions_presence_content(inputs)
});
/**
* | output |
* | --- |
* | "Motion respects your system’s reduced-motion preference. No animation is required to access the content." |
*
* @param {Interactions_Motion_HelpInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_motion_help = /** @type {((inputs?: Interactions_Motion_HelpInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_Motion_HelpInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_motion_help(inputs)
	return __fr.interactions_motion_help(inputs)
});
/**
* | output |
* | --- |
* | "Change content height" |
*
* @param {Interactions_Resize_ContentInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_resize_content = /** @type {((inputs?: Interactions_Resize_ContentInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_Resize_ContentInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_resize_content(inputs)
	return __fr.interactions_resize_content(inputs)
});
/**
* | output |
* | --- |
* | "The container follows its content height." |
*
* @param {Interactions_Height_SummaryInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_height_summary = /** @type {((inputs?: Interactions_Height_SummaryInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_Height_SummaryInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_height_summary(inputs)
	return __fr.interactions_height_summary(inputs)
});
/**
* | output |
* | --- |
* | "There is no hardcoded expanded height. ResizeObserver measures the inner content, including changes caused by wrapping text, loading images or live data. Red..." |
*
* @param {Interactions_Height_DetailsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_height_details = /** @type {((inputs?: Interactions_Height_DetailsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_Height_DetailsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_height_details(inputs)
	return __fr.interactions_height_details(inputs)
});
/**
* | output |
* | --- |
* | "Add item" |
*
* @param {Interactions_Add_ItemInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_add_item = /** @type {((inputs?: Interactions_Add_ItemInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_Add_ItemInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_add_item(inputs)
	return __fr.interactions_add_item(inputs)
});
/**
* | output |
* | --- |
* | "Reverse order" |
*
* @param {Interactions_Reverse_ItemsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_reverse_items = /** @type {((inputs?: Interactions_Reverse_ItemsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_Reverse_ItemsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_reverse_items(inputs)
	return __fr.interactions_reverse_items(inputs)
});
/**
* | output |
* | --- |
* | "Example items" |
*
* @param {Interactions_Example_ListInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_example_list = /** @type {((inputs?: Interactions_Example_ListInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_Example_ListInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_example_list(inputs)
	return __fr.interactions_example_list(inputs)
});
/**
* | output |
* | --- |
* | "Item {count}" |
*
* @param {Interactions_ItemInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_item = /** @type {((inputs: Interactions_ItemInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_ItemInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_item(inputs)
	return __fr.interactions_item(inputs)
});
/**
* | output |
* | --- |
* | "Remove item {count}" |
*
* @param {Interactions_Remove_ItemInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_remove_item = /** @type {((inputs: Interactions_Remove_ItemInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_Remove_ItemInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_remove_item(inputs)
	return __fr.interactions_remove_item(inputs)
});
/**
* | output |
* | --- |
* | "Remove" |
*
* @param {Interactions_RemoveInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_remove = /** @type {((inputs?: Interactions_RemoveInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_RemoveInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_remove(inputs)
	return __fr.interactions_remove(inputs)
});
/**
* | output |
* | --- |
* | "Example total" |
*
* @param {Interactions_Example_TotalInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_example_total = /** @type {((inputs?: Interactions_Example_TotalInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_Example_TotalInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_example_total(inputs)
	return __fr.interactions_example_total(inputs)
});
/**
* | output |
* | --- |
* | "Increase total" |
*
* @param {Interactions_IncreaseInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_increase = /** @type {((inputs?: Interactions_IncreaseInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_IncreaseInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_increase(inputs)
	return __fr.interactions_increase(inputs)
});
/**
* | output |
* | --- |
* | "Reset" |
*
* @param {Interactions_ResetInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const interactions_reset = /** @type {((inputs?: Interactions_ResetInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Interactions_ResetInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.interactions_reset(inputs)
	return __fr.interactions_reset(inputs)
});
/**
* | output |
* | --- |
* | "Component example" |
*
* @param {Registry_Docs_ExampleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const registry_docs_example = /** @type {((inputs?: Registry_Docs_ExampleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Registry_Docs_ExampleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.registry_docs_example(inputs)
	return __fr.registry_docs_example(inputs)
});
/**
* | output |
* | --- |
* | "Preview" |
*
* @param {Registry_Docs_PreviewInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const registry_docs_preview = /** @type {((inputs?: Registry_Docs_PreviewInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Registry_Docs_PreviewInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.registry_docs_preview(inputs)
	return __fr.registry_docs_preview(inputs)
});
/**
* | output |
* | --- |
* | "Code" |
*
* @param {Registry_Docs_CodeInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const registry_docs_code = /** @type {((inputs?: Registry_Docs_CodeInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Registry_Docs_CodeInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.registry_docs_code(inputs)
	return __fr.registry_docs_code(inputs)
});
/**
* | output |
* | --- |
* | "Dependencies" |
*
* @param {Registry_Docs_DependenciesInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const registry_docs_dependencies = /** @type {((inputs?: Registry_Docs_DependenciesInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Registry_Docs_DependenciesInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.registry_docs_dependencies(inputs)
	return __fr.registry_docs_dependencies(inputs)
});
/**
* | output |
* | --- |
* | "Development dependencies" |
*
* @param {Registry_Docs_Dev_DependenciesInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const registry_docs_dev_dependencies = /** @type {((inputs?: Registry_Docs_Dev_DependenciesInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Registry_Docs_Dev_DependenciesInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.registry_docs_dev_dependencies(inputs)
	return __fr.registry_docs_dev_dependencies(inputs)
});
/**
* | output |
* | --- |
* | "Registry dependencies" |
*
* @param {Registry_Docs_Registry_DependenciesInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const registry_docs_registry_dependencies = /** @type {((inputs?: Registry_Docs_Registry_DependenciesInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Registry_Docs_Registry_DependenciesInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.registry_docs_registry_dependencies(inputs)
	return __fr.registry_docs_registry_dependencies(inputs)
});
/**
* | output |
* | --- |
* | "Packages and registry items required by this item." |
*
* @param {Registry_Docs_Dependencies_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const registry_docs_dependencies_description = /** @type {((inputs?: Registry_Docs_Dependencies_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Registry_Docs_Dependencies_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.registry_docs_dependencies_description(inputs)
	return __fr.registry_docs_dependencies_description(inputs)
});
/**
* | output |
* | --- |
* | "Open the app menu. These example links stay on this page; the simulator is unavailable." |
*
* @param {New_Components_Switcher_HelpInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_switcher_help = /** @type {((inputs?: New_Components_Switcher_HelpInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_Switcher_HelpInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_switcher_help(inputs)
	return __fr.new_components_switcher_help(inputs)
});
/**
* | output |
* | --- |
* | "Learning" |
*
* @param {New_Components_LearningInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_learning = /** @type {((inputs?: New_Components_LearningInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_LearningInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_learning(inputs)
	return __fr.new_components_learning(inputs)
});
/**
* | output |
* | --- |
* | "Explore your learning workspace." |
*
* @param {New_Components_Learning_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_learning_description = /** @type {((inputs?: New_Components_Learning_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_Learning_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_learning_description(inputs)
	return __fr.new_components_learning_description(inputs)
});
/**
* | output |
* | --- |
* | "Courses" |
*
* @param {New_Components_CoursesInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_courses = /** @type {((inputs?: New_Components_CoursesInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_CoursesInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_courses(inputs)
	return __fr.new_components_courses(inputs)
});
/**
* | output |
* | --- |
* | "Create and manage course content." |
*
* @param {New_Components_Courses_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_courses_description = /** @type {((inputs?: New_Components_Courses_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_Courses_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_courses_description(inputs)
	return __fr.new_components_courses_description(inputs)
});
/**
* | output |
* | --- |
* | "Simulator" |
*
* @param {New_Components_SimulatorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_simulator = /** @type {((inputs?: New_Components_SimulatorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_SimulatorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_simulator(inputs)
	return __fr.new_components_simulator(inputs)
});
/**
* | output |
* | --- |
* | "Example API key" |
*
* @param {New_Components_Example_KeyInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_example_key = /** @type {((inputs?: New_Components_Example_KeyInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_Example_KeyInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_example_key(inputs)
	return __fr.new_components_example_key(inputs)
});
/**
* | output |
* | --- |
* | "Disabled example key" |
*
* @param {New_Components_Disabled_KeyInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_disabled_key = /** @type {((inputs?: New_Components_Disabled_KeyInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_Disabled_KeyInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_disabled_key(inputs)
	return __fr.new_components_disabled_key(inputs)
});
/**
* | output |
* | --- |
* | "Example values only. Revealed values hide again after five seconds. Masking is not a security boundary." |
*
* @param {New_Components_Secret_HelpInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_secret_help = /** @type {((inputs?: New_Components_Secret_HelpInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_Secret_HelpInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_secret_help(inputs)
	return __fr.new_components_secret_help(inputs)
});
/**
* | output |
* | --- |
* | "Recipients" |
*
* @param {New_Components_RecipientsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_recipients = /** @type {((inputs?: New_Components_RecipientsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_RecipientsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_recipients(inputs)
	return __fr.new_components_recipients(inputs)
});
/**
* | output |
* | --- |
* | "Unique entries: {count}. Duplicates: {duplicates}." |
*
* @param {New_Components_List_SummaryInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_list_summary = /** @type {((inputs: New_Components_List_SummaryInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_List_SummaryInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_list_summary(inputs)
	return __fr.new_components_list_summary(inputs)
});
/**
* | output |
* | --- |
* | "The draft stays unchanged while you type. This example normalizes case for duplicate counting; it does not validate email addresses or send messages." |
*
* @param {New_Components_List_HelpInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_list_help = /** @type {((inputs?: New_Components_List_HelpInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_List_HelpInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_list_help(inputs)
	return __fr.new_components_list_help(inputs)
});
/**
* | output |
* | --- |
* | "Email" |
*
* @param {New_Components_EmailInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_email = /** @type {((inputs?: New_Components_EmailInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_EmailInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_email(inputs)
	return __fr.new_components_email(inputs)
});
/**
* | output |
* | --- |
* | "Receive updates in your inbox." |
*
* @param {New_Components_Email_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_email_description = /** @type {((inputs?: New_Components_Email_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_Email_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_email_description(inputs)
	return __fr.new_components_email_description(inputs)
});
/**
* | output |
* | --- |
* | "In-app messages" |
*
* @param {New_Components_MessageInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_message = /** @type {((inputs?: New_Components_MessageInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_MessageInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_message(inputs)
	return __fr.new_components_message(inputs)
});
/**
* | output |
* | --- |
* | "Read updates in your workspace." |
*
* @param {New_Components_Message_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_message_description = /** @type {((inputs?: New_Components_Message_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_Message_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_message_description(inputs)
	return __fr.new_components_message_description(inputs)
});
/**
* | output |
* | --- |
* | "Choose a primary channel" |
*
* @param {New_Components_Primary_ChannelInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_primary_channel = /** @type {((inputs?: New_Components_Primary_ChannelInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_Primary_ChannelInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_primary_channel(inputs)
	return __fr.new_components_primary_channel(inputs)
});
/**
* | output |
* | --- |
* | "Choose available channels" |
*
* @param {New_Components_ChannelsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_channels = /** @type {((inputs?: New_Components_ChannelsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_ChannelsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_channels(inputs)
	return __fr.new_components_channels(inputs)
});
/**
* | output |
* | --- |
* | "Uploading" |
*
* @param {New_Components_Upload_ProgressInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_upload_progress = /** @type {((inputs?: New_Components_Upload_ProgressInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_Upload_ProgressInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_upload_progress(inputs)
	return __fr.new_components_upload_progress(inputs)
});
/**
* | output |
* | --- |
* | "Processing" |
*
* @param {New_Components_Upload_ProcessingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_upload_processing = /** @type {((inputs?: New_Components_Upload_ProcessingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_Upload_ProcessingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_upload_processing(inputs)
	return __fr.new_components_upload_processing(inputs)
});
/**
* | output |
* | --- |
* | "Complete" |
*
* @param {New_Components_Upload_DoneInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_upload_done = /** @type {((inputs?: New_Components_Upload_DoneInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_Upload_DoneInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_upload_done(inputs)
	return __fr.new_components_upload_done(inputs)
});
/**
* | output |
* | --- |
* | "Show error" |
*
* @param {New_Components_Upload_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_upload_error = /** @type {((inputs?: New_Components_Upload_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_Upload_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_upload_error(inputs)
	return __fr.new_components_upload_error(inputs)
});
/**
* | output |
* | --- |
* | "Example upload failure. Try again." |
*
* @param {New_Components_Upload_FailureInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_upload_failure = /** @type {((inputs?: New_Components_Upload_FailureInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_Upload_FailureInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_upload_failure(inputs)
	return __fr.new_components_upload_failure(inputs)
});
/**
* | output |
* | --- |
* | "State demonstration only: no file is uploaded. Your application supplies real progress and owns cancellation, retry and processing." |
*
* @param {New_Components_Upload_HelpInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const new_components_upload_help = /** @type {((inputs?: New_Components_Upload_HelpInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<New_Components_Upload_HelpInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.new_components_upload_help(inputs)
	return __fr.new_components_upload_help(inputs)
});
/**
* | output |
* | --- |
* | "Map menu" |
*
* @param {Map_Picker_Preview_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const map_picker_preview_title = /** @type {((inputs?: Map_Picker_Preview_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Map_Picker_Preview_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.map_picker_preview_title(inputs)
	return __fr.map_picker_preview_title(inputs)
});
/**
* | output |
* | --- |
* | "Try radius selection or pinpoint-only selection and draft confirmation. Suggestions and IP/browser location actions use example data; no lookup or location p..." |
*
* @param {Map_Picker_Preview_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const map_picker_preview_description = /** @type {((inputs?: Map_Picker_Preview_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Map_Picker_Preview_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.map_picker_preview_description(inputs)
	return __fr.map_picker_preview_description(inputs)
});
/**
* | output |
* | --- |
* | "Choose a pinpoint" |
*
* @param {Map_Menu_Preview_PointInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const map_menu_preview_point = /** @type {((inputs?: Map_Menu_Preview_PointInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Map_Menu_Preview_PointInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.map_menu_preview_point(inputs)
	return __fr.map_menu_preview_point(inputs)
});
/**
* | output |
* | --- |
* | "Selected: {place}" |
*
* @param {Map_Menu_Preview_Selected_PointInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const map_menu_preview_selected_point = /** @type {((inputs: Map_Menu_Preview_Selected_PointInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Map_Menu_Preview_Selected_PointInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.map_menu_preview_selected_point(inputs)
	return __fr.map_menu_preview_selected_point(inputs)
});
/**
* | output |
* | --- |
* | "Inline location selection" |
*
* @param {Map_Menu_Preview_Inline_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const map_menu_preview_inline_title = /** @type {((inputs?: Map_Menu_Preview_Inline_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Map_Menu_Preview_Inline_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.map_menu_preview_inline_title(inputs)
	return __fr.map_menu_preview_inline_title(inputs)
});
/**
* | output |
* | --- |
* | "Search above the map without opening a dialog. Red pins and address details match the popup. Confirm to save this example selection, or Cancel to restore it...." |
*
* @param {Map_Menu_Preview_Inline_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const map_menu_preview_inline_description = /** @type {((inputs?: Map_Menu_Preview_Inline_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Map_Menu_Preview_Inline_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.map_menu_preview_inline_description(inputs)
	return __fr.map_menu_preview_inline_description(inputs)
});
/**
* | output |
* | --- |
* | "Google Maps browser key (optional)" |
*
* @param {Map_Picker_Preview_KeyInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const map_picker_preview_key = /** @type {((inputs?: Map_Picker_Preview_KeyInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Map_Picker_Preview_KeyInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.map_picker_preview_key(inputs)
	return __fr.map_picker_preview_key(inputs)
});
/**
* | output |
* | --- |
* | "A referrer-restricted browser key" |
*
* @param {Map_Picker_Preview_Key_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const map_picker_preview_key_placeholder = /** @type {((inputs?: Map_Picker_Preview_Key_PlaceholderInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Map_Picker_Preview_Key_PlaceholderInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.map_picker_preview_key_placeholder(inputs)
	return __fr.map_picker_preview_key_placeholder(inputs)
});
/**
* | output |
* | --- |
* | "Choose a location" |
*
* @param {Map_Picker_Preview_OpenInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const map_picker_preview_open = /** @type {((inputs?: Map_Picker_Preview_OpenInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Map_Picker_Preview_OpenInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.map_picker_preview_open(inputs)
	return __fr.map_picker_preview_open(inputs)
});
/**
* | output |
* | --- |
* | "Selected: {place} · {distance} km" |
*
* @param {Map_Picker_Preview_SelectedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const map_picker_preview_selected = /** @type {((inputs: Map_Picker_Preview_SelectedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Map_Picker_Preview_SelectedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.map_picker_preview_selected(inputs)
	return __fr.map_picker_preview_selected(inputs)
});
/**
* | output |
* | --- |
* | "Step navigation" |
*
* @param {Stepper_Preview_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const stepper_preview_title = /** @type {((inputs?: Stepper_Preview_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Stepper_Preview_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.stepper_preview_title(inputs)
	return __fr.stepper_preview_title(inputs)
});
/**
* | output |
* | --- |
* | "Try the steps or use Previous and Continue. The host controls navigation; the stepper never saves a form." |
*
* @param {Stepper_Preview_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const stepper_preview_description = /** @type {((inputs?: Stepper_Preview_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Stepper_Preview_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.stepper_preview_description(inputs)
	return __fr.stepper_preview_description(inputs)
});
/**
* | output |
* | --- |
* | "Connect" |
*
* @param {Stepper_Preview_ConnectInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const stepper_preview_connect = /** @type {((inputs?: Stepper_Preview_ConnectInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Stepper_Preview_ConnectInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.stepper_preview_connect(inputs)
	return __fr.stepper_preview_connect(inputs)
});
/**
* | output |
* | --- |
* | "Configure" |
*
* @param {Stepper_Preview_ConfigureInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const stepper_preview_configure = /** @type {((inputs?: Stepper_Preview_ConfigureInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Stepper_Preview_ConfigureInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.stepper_preview_configure(inputs)
	return __fr.stepper_preview_configure(inputs)
});
/**
* | output |
* | --- |
* | "Verify" |
*
* @param {Stepper_Preview_VerifyInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const stepper_preview_verify = /** @type {((inputs?: Stepper_Preview_VerifyInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Stepper_Preview_VerifyInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.stepper_preview_verify(inputs)
	return __fr.stepper_preview_verify(inputs)
});
/**
* | output |
* | --- |
* | "Your project supplies the content, validation and saving behavior for this step." |
*
* @param {Stepper_Preview_ContentInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const stepper_preview_content = /** @type {((inputs?: Stepper_Preview_ContentInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Stepper_Preview_ContentInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.stepper_preview_content(inputs)
	return __fr.stepper_preview_content(inputs)
});
/**
* | output |
* | --- |
* | "Previous" |
*
* @param {Stepper_Preview_PreviousInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const stepper_preview_previous = /** @type {((inputs?: Stepper_Preview_PreviousInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Stepper_Preview_PreviousInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.stepper_preview_previous(inputs)
	return __fr.stepper_preview_previous(inputs)
});
/**
* | output |
* | --- |
* | "Continue" |
*
* @param {Stepper_Preview_ContinueInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const stepper_preview_continue = /** @type {((inputs?: Stepper_Preview_ContinueInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Stepper_Preview_ContinueInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.stepper_preview_continue(inputs)
	return __fr.stepper_preview_continue(inputs)
});
/**
* | output |
* | --- |
* | "Start again" |
*
* @param {Stepper_Preview_RestartInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const stepper_preview_restart = /** @type {((inputs?: Stepper_Preview_RestartInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Stepper_Preview_RestartInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.stepper_preview_restart(inputs)
	return __fr.stepper_preview_restart(inputs)
});
/**
* | output |
* | --- |
* | "Details" |
*
* @param {Stepper_Example_DetailsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const stepper_example_details = /** @type {((inputs?: Stepper_Example_DetailsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Stepper_Example_DetailsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.stepper_example_details(inputs)
	return __fr.stepper_example_details(inputs)
});
/**
* | output |
* | --- |
* | "Review" |
*
* @param {Stepper_Example_ReviewInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const stepper_example_review = /** @type {((inputs?: Stepper_Example_ReviewInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Stepper_Example_ReviewInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.stepper_example_review(inputs)
	return __fr.stepper_example_review(inputs)
});
/**
* | output |
* | --- |
* | "Done" |
*
* @param {Stepper_Example_DoneInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const stepper_example_done = /** @type {((inputs?: Stepper_Example_DoneInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Stepper_Example_DoneInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.stepper_example_done(inputs)
	return __fr.stepper_example_done(inputs)
});
/**
* | output |
* | --- |
* | "A form with review" |
*
* @param {Stepper_Example_Form_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const stepper_example_form_title = /** @type {((inputs?: Stepper_Example_Form_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Stepper_Example_Form_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.stepper_example_form_title(inputs)
	return __fr.stepper_example_form_title(inputs)
});
/**
* | output |
* | --- |
* | "Enter a project name, review it, then confirm. Previous skips validation and keeps your draft. This demo does not save data." |
*
* @param {Stepper_Example_Form_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const stepper_example_form_description = /** @type {((inputs?: Stepper_Example_Form_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Stepper_Example_Form_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.stepper_example_form_description(inputs)
	return __fr.stepper_example_form_description(inputs)
});
/**
* | output |
* | --- |
* | "Project name (required)" |
*
* @param {Stepper_Example_NameInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const stepper_example_name = /** @type {((inputs?: Stepper_Example_NameInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Stepper_Example_NameInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.stepper_example_name(inputs)
	return __fr.stepper_example_name(inputs)
});
/**
* | output |
* | --- |
* | "Confirm" |
*
* @param {Stepper_Example_ConfirmInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const stepper_example_confirm = /** @type {((inputs?: Stepper_Example_ConfirmInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Stepper_Example_ConfirmInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.stepper_example_confirm(inputs)
	return __fr.stepper_example_confirm(inputs)
});
/**
* | output |
* | --- |
* | "Review complete. Nothing was sent or saved; your draft stays available until you leave this page." |
*
* @param {Stepper_Example_FinishedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const stepper_example_finished = /** @type {((inputs?: Stepper_Example_FinishedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Stepper_Example_FinishedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.stepper_example_finished(inputs)
	return __fr.stepper_example_finished(inputs)
});
/**
* | output |
* | --- |
* | "Read-only progress" |
*
* @param {Stepper_Example_Vertical_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const stepper_example_vertical_title = /** @type {((inputs?: Stepper_Example_Vertical_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Stepper_Example_Vertical_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.stepper_example_vertical_title(inputs)
	return __fr.stepper_example_vertical_title(inputs)
});
/**
* | output |
* | --- |
* | "A vertical layout with descriptions and explicit states, without navigation controls or numbered indicators." |
*
* @param {Stepper_Example_Vertical_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const stepper_example_vertical_description = /** @type {((inputs?: Stepper_Example_Vertical_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Stepper_Example_Vertical_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.stepper_example_vertical_description(inputs)
	return __fr.stepper_example_vertical_description(inputs)
});
/**
* | output |
* | --- |
* | "Connection established" |
*
* @param {Stepper_Example_ConnectedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const stepper_example_connected = /** @type {((inputs?: Stepper_Example_ConnectedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Stepper_Example_ConnectedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.stepper_example_connected(inputs)
	return __fr.stepper_example_connected(inputs)
});
/**
* | output |
* | --- |
* | "Configuration needs attention" |
*
* @param {Stepper_Example_AttentionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const stepper_example_attention = /** @type {((inputs?: Stepper_Example_AttentionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Stepper_Example_AttentionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.stepper_example_attention(inputs)
	return __fr.stepper_example_attention(inputs)
});
/**
* | output |
* | --- |
* | "Waiting for configuration" |
*
* @param {Stepper_Example_WaitingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const stepper_example_waiting = /** @type {((inputs?: Stepper_Example_WaitingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Stepper_Example_WaitingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.stepper_example_waiting(inputs)
	return __fr.stepper_example_waiting(inputs)
});
/**
* | output |
* | --- |
* | "Staff email administration" |
*
* @param {Notifications_Staff_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const notifications_staff_title = /** @type {((inputs?: Notifications_Staff_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Staff_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.notifications_staff_title(inputs)
	return __fr.notifications_staff_title(inputs)
});
/**
* | output |
* | --- |
* | "Read-only access to existing email deliveries within your authorized scopes. Acceptance is not confirmed delivery or reading." |
*
* @param {Notifications_Staff_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const notifications_staff_description = /** @type {((inputs?: Notifications_Staff_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Staff_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.notifications_staff_description(inputs)
	return __fr.notifications_staff_description(inputs)
});
/**
* | output |
* | --- |
* | "Publication source" |
*
* @param {Notifications_Staff_SourceInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const notifications_staff_source = /** @type {((inputs?: Notifications_Staff_SourceInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Staff_SourceInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.notifications_staff_source(inputs)
	return __fr.notifications_staff_source(inputs)
});
/**
* | output |
* | --- |
* | "All authorized emails" |
*
* @param {Notifications_Staff_AllInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const notifications_staff_all = /** @type {((inputs?: Notifications_Staff_AllInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Staff_AllInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.notifications_staff_all(inputs)
	return __fr.notifications_staff_all(inputs)
});
/**
* | output |
* | --- |
* | "Legacy contact publications" |
*
* @param {Notifications_Staff_ContactsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const notifications_staff_contacts = /** @type {((inputs?: Notifications_Staff_ContactsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Staff_ContactsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.notifications_staff_contacts(inputs)
	return __fr.notifications_staff_contacts(inputs)
});
/**
* | output |
* | --- |
* | "Native publications" |
*
* @param {Notifications_Staff_EngineInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const notifications_staff_engine = /** @type {((inputs?: Notifications_Staff_EngineInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Staff_EngineInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.notifications_staff_engine(inputs)
	return __fr.notifications_staff_engine(inputs)
});
/**
* | output |
* | --- |
* | "Recipient account" |
*
* @param {Notifications_Staff_AccountInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const notifications_staff_account = /** @type {((inputs?: Notifications_Staff_AccountInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Staff_AccountInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.notifications_staff_account(inputs)
	return __fr.notifications_staff_account(inputs)
});
/**
* | output |
* | --- |
* | "Organization" |
*
* @param {Notifications_Staff_OrganizationInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const notifications_staff_organization = /** @type {((inputs?: Notifications_Staff_OrganizationInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Staff_OrganizationInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.notifications_staff_organization(inputs)
	return __fr.notifications_staff_organization(inputs)
});
/**
* | output |
* | --- |
* | "Workspace" |
*
* @param {Notifications_Staff_WorkspaceInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const notifications_staff_workspace = /** @type {((inputs?: Notifications_Staff_WorkspaceInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Staff_WorkspaceInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.notifications_staff_workspace(inputs)
	return __fr.notifications_staff_workspace(inputs)
});
/**
* | output |
* | --- |
* | "Template" |
*
* @param {Notifications_Staff_TemplateInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const notifications_staff_template = /** @type {((inputs?: Notifications_Staff_TemplateInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Staff_TemplateInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.notifications_staff_template(inputs)
	return __fr.notifications_staff_template(inputs)
});
/**
* | output |
* | --- |
* | "Transactional" |
*
* @param {Notifications_Staff_TransactionalInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const notifications_staff_transactional = /** @type {((inputs?: Notifications_Staff_TransactionalInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Staff_TransactionalInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.notifications_staff_transactional(inputs)
	return __fr.notifications_staff_transactional(inputs)
});
/**
* | output |
* | --- |
* | "Notification" |
*
* @param {Notifications_Staff_NotificationInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const notifications_staff_notification = /** @type {((inputs?: Notifications_Staff_NotificationInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Staff_NotificationInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.notifications_staff_notification(inputs)
	return __fr.notifications_staff_notification(inputs)
});
/**
* | output |
* | --- |
* | "Marketing" |
*
* @param {Notifications_Staff_MarketingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const notifications_staff_marketing = /** @type {((inputs?: Notifications_Staff_MarketingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Staff_MarketingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.notifications_staff_marketing(inputs)
	return __fr.notifications_staff_marketing(inputs)
});
/**
* | output |
* | --- |
* | "Event key" |
*
* @param {Notifications_Staff_EventInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const notifications_staff_event = /** @type {((inputs?: Notifications_Staff_EventInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Staff_EventInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.notifications_staff_event(inputs)
	return __fr.notifications_staff_event(inputs)
});
/**
* | output |
* | --- |
* | "Authorized domain references" |
*
* @param {Notifications_Staff_ReferencesInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const notifications_staff_references = /** @type {((inputs?: Notifications_Staff_ReferencesInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Staff_ReferencesInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.notifications_staff_references(inputs)
	return __fr.notifications_staff_references(inputs)
});
/**
* | output |
* | --- |
* | "Confirmation and bounce counts cover only deliveries with configured provider feedback. Unavailable feedback is not evidence of successful delivery or zero b..." |
*
* @param {Notifications_Staff_Feedback_NoticeInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const notifications_staff_feedback_notice = /** @type {((inputs?: Notifications_Staff_Feedback_NoticeInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Staff_Feedback_NoticeInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.notifications_staff_feedback_notice(inputs)
	return __fr.notifications_staff_feedback_notice(inputs)
});
/**
* | output |
* | --- |
* | "Emails covered by feedback reconciliation" |
*
* @param {Notifications_Staff_Feedback_CoveredInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const notifications_staff_feedback_covered = /** @type {((inputs?: Notifications_Staff_Feedback_CoveredInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Staff_Feedback_CoveredInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.notifications_staff_feedback_covered(inputs)
	return __fr.notifications_staff_feedback_covered(inputs)
});
/**
* | output |
* | --- |
* | "Emails without feedback coverage" |
*
* @param {Notifications_Staff_Feedback_UnavailableInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const notifications_staff_feedback_unavailable = /** @type {((inputs?: Notifications_Staff_Feedback_UnavailableInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notifications_Staff_Feedback_UnavailableInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.notifications_staff_feedback_unavailable(inputs)
	return __fr.notifications_staff_feedback_unavailable(inputs)
});
/**
* | output |
* | --- |
* | "Contact profile and consent history" |
*
* @param {Kraksend_Ops_Contact_HistoryInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_contact_history = /** @type {((inputs?: Kraksend_Ops_Contact_HistoryInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_Contact_HistoryInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_contact_history(inputs)
	return __fr.kraksend_ops_contact_history(inputs)
});
/**
* | output |
* | --- |
* | "Consent source" |
*
* @param {Kraksend_Ops_SourceInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_source = /** @type {((inputs?: Kraksend_Ops_SourceInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_SourceInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_source(inputs)
	return __fr.kraksend_ops_source(inputs)
});
/**
* | output |
* | --- |
* | "Notice version" |
*
* @param {Kraksend_Ops_Notice_VersionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_notice_version = /** @type {((inputs?: Kraksend_Ops_Notice_VersionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_Notice_VersionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_notice_version(inputs)
	return __fr.kraksend_ops_notice_version(inputs)
});
/**
* | output |
* | --- |
* | "Contact language" |
*
* @param {Kraksend_Ops_LocaleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_locale = /** @type {((inputs?: Kraksend_Ops_LocaleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_LocaleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_locale(inputs)
	return __fr.kraksend_ops_locale(inputs)
});
/**
* | output |
* | --- |
* | "Sending operations" |
*
* @param {Kraksend_Ops_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_title = /** @type {((inputs?: Kraksend_Ops_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_title(inputs)
	return __fr.kraksend_ops_title(inputs)
});
/**
* | output |
* | --- |
* | "Installation email activity, refreshed every 15 seconds. Dates use ISO timestamps with timezone; end is exclusive. Delivery statistics use publication time; ..." |
*
* @param {Kraksend_Ops_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_description = /** @type {((inputs?: Kraksend_Ops_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_description(inputs)
	return __fr.kraksend_ops_description(inputs)
});
/**
* | output |
* | --- |
* | "Overview" |
*
* @param {Kraksend_Ops_OverviewInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_overview = /** @type {((inputs?: Kraksend_Ops_OverviewInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_OverviewInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_overview(inputs)
	return __fr.kraksend_ops_overview(inputs)
});
/**
* | output |
* | --- |
* | "Delivery activity" |
*
* @param {Kraksend_Ops_ActivityInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_activity = /** @type {((inputs?: Kraksend_Ops_ActivityInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_ActivityInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_activity(inputs)
	return __fr.kraksend_ops_activity(inputs)
});
/**
* | output |
* | --- |
* | "Bounces and feedback" |
*
* @param {Kraksend_Ops_FeedbackInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_feedback = /** @type {((inputs?: Kraksend_Ops_FeedbackInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_FeedbackInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_feedback(inputs)
	return __fr.kraksend_ops_feedback(inputs)
});
/**
* | output |
* | --- |
* | "Suppressions" |
*
* @param {Kraksend_Ops_SuppressionsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_suppressions = /** @type {((inputs?: Kraksend_Ops_SuppressionsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_SuppressionsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_suppressions(inputs)
	return __fr.kraksend_ops_suppressions(inputs)
});
/**
* | output |
* | --- |
* | "Suppression history" |
*
* @param {Kraksend_Ops_AuditInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_audit = /** @type {((inputs?: Kraksend_Ops_AuditInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_AuditInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_audit(inputs)
	return __fr.kraksend_ops_audit(inputs)
});
/**
* | output |
* | --- |
* | "Campaign recipients" |
*
* @param {Kraksend_Ops_RecipientsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_recipients = /** @type {((inputs?: Kraksend_Ops_RecipientsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_RecipientsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_recipients(inputs)
	return __fr.kraksend_ops_recipients(inputs)
});
/**
* | output |
* | --- |
* | "Refresh" |
*
* @param {Kraksend_Ops_RefreshInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_refresh = /** @type {((inputs?: Kraksend_Ops_RefreshInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_RefreshInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_refresh(inputs)
	return __fr.kraksend_ops_refresh(inputs)
});
/**
* | output |
* | --- |
* | "No matching records." |
*
* @param {Kraksend_Ops_EmptyInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_empty = /** @type {((inputs?: Kraksend_Ops_EmptyInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_EmptyInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_empty(inputs)
	return __fr.kraksend_ops_empty(inputs)
});
/**
* | output |
* | --- |
* | "Search records" |
*
* @param {Kraksend_Ops_SearchInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_search = /** @type {((inputs?: Kraksend_Ops_SearchInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_SearchInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_search(inputs)
	return __fr.kraksend_ops_search(inputs)
});
/**
* | output |
* | --- |
* | "From (ISO timestamp, optional)" |
*
* @param {Kraksend_Ops_SinceInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_since = /** @type {((inputs?: Kraksend_Ops_SinceInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_SinceInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_since(inputs)
	return __fr.kraksend_ops_since(inputs)
});
/**
* | output |
* | --- |
* | "Until (ISO timestamp, optional)" |
*
* @param {Kraksend_Ops_UntilInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_until = /** @type {((inputs?: Kraksend_Ops_UntilInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_UntilInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_until(inputs)
	return __fr.kraksend_ops_until(inputs)
});
/**
* | output |
* | --- |
* | "Apply filters" |
*
* @param {Kraksend_Ops_ApplyInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_apply = /** @type {((inputs?: Kraksend_Ops_ApplyInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_ApplyInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_apply(inputs)
	return __fr.kraksend_ops_apply(inputs)
});
/**
* | output |
* | --- |
* | "All" |
*
* @param {Kraksend_Ops_AllInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_all = /** @type {((inputs?: Kraksend_Ops_AllInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_AllInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_all(inputs)
	return __fr.kraksend_ops_all(inputs)
});
/**
* | output |
* | --- |
* | "Total publications" |
*
* @param {Kraksend_Ops_TotalInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_total = /** @type {((inputs?: Kraksend_Ops_TotalInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_TotalInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_total(inputs)
	return __fr.kraksend_ops_total(inputs)
});
/**
* | output |
* | --- |
* | "Queued" |
*
* @param {Kraksend_Ops_QueuedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_queued = /** @type {((inputs?: Kraksend_Ops_QueuedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_QueuedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_queued(inputs)
	return __fr.kraksend_ops_queued(inputs)
});
/**
* | output |
* | --- |
* | "Processing" |
*
* @param {Kraksend_Ops_ProcessingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_processing = /** @type {((inputs?: Kraksend_Ops_ProcessingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_ProcessingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_processing(inputs)
	return __fr.kraksend_ops_processing(inputs)
});
/**
* | output |
* | --- |
* | "Retrying or deferred" |
*
* @param {Kraksend_Ops_RetryingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_retrying = /** @type {((inputs?: Kraksend_Ops_RetryingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_RetryingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_retrying(inputs)
	return __fr.kraksend_ops_retrying(inputs)
});
/**
* | output |
* | --- |
* | "Soft bounced" |
*
* @param {Kraksend_Ops_Soft_BouncedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_soft_bounced = /** @type {((inputs?: Kraksend_Ops_Soft_BouncedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_Soft_BouncedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_soft_bounced(inputs)
	return __fr.kraksend_ops_soft_bounced(inputs)
});
/**
* | output |
* | --- |
* | "Unmatched feedback events" |
*
* @param {Kraksend_Ops_Pending_FeedbackInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_pending_feedback = /** @type {((inputs?: Kraksend_Ops_Pending_FeedbackInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_Pending_FeedbackInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_pending_feedback(inputs)
	return __fr.kraksend_ops_pending_feedback(inputs)
});
/**
* | output |
* | --- |
* | "Active suppression records" |
*
* @param {Kraksend_Ops_Active_SuppressionsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_active_suppressions = /** @type {((inputs?: Kraksend_Ops_Active_SuppressionsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_Active_SuppressionsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_active_suppressions(inputs)
	return __fr.kraksend_ops_active_suppressions(inputs)
});
/**
* | output |
* | --- |
* | "Hard and soft bounces" |
*
* @param {Kraksend_Ops_BouncesInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_bounces = /** @type {((inputs?: Kraksend_Ops_BouncesInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_BouncesInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_bounces(inputs)
	return __fr.kraksend_ops_bounces(inputs)
});
/**
* | output |
* | --- |
* | "Campaign" |
*
* @param {Kraksend_Ops_CampaignInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_campaign = /** @type {((inputs?: Kraksend_Ops_CampaignInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_CampaignInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_campaign(inputs)
	return __fr.kraksend_ops_campaign(inputs)
});
/**
* | output |
* | --- |
* | "Campaign ID (optional for activity)" |
*
* @param {Kraksend_Ops_Campaign_IdInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_campaign_id = /** @type {((inputs?: Kraksend_Ops_Campaign_IdInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_Campaign_IdInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_campaign_id(inputs)
	return __fr.kraksend_ops_campaign_id(inputs)
});
/**
* | output |
* | --- |
* | "Provider" |
*
* @param {Kraksend_Ops_ProviderInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_provider = /** @type {((inputs?: Kraksend_Ops_ProviderInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_ProviderInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_provider(inputs)
	return __fr.kraksend_ops_provider(inputs)
});
/**
* | output |
* | --- |
* | "Provider message ID" |
*
* @param {Kraksend_Ops_Provider_Message_IdInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_provider_message_id = /** @type {((inputs?: Kraksend_Ops_Provider_Message_IdInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_Provider_Message_IdInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_provider_message_id(inputs)
	return __fr.kraksend_ops_provider_message_id(inputs)
});
/**
* | output |
* | --- |
* | "Provider attempts" |
*
* @param {Kraksend_Ops_AttemptsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_attempts = /** @type {((inputs?: Kraksend_Ops_AttemptsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_AttemptsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_attempts(inputs)
	return __fr.kraksend_ops_attempts(inputs)
});
/**
* | output |
* | --- |
* | "Created" |
*
* @param {Kraksend_Ops_CreatedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_created = /** @type {((inputs?: Kraksend_Ops_CreatedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_CreatedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_created(inputs)
	return __fr.kraksend_ops_created(inputs)
});
/**
* | output |
* | --- |
* | "Scheduled for" |
*
* @param {Kraksend_Ops_ScheduledInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_scheduled = /** @type {((inputs?: Kraksend_Ops_ScheduledInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_ScheduledInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_scheduled(inputs)
	return __fr.kraksend_ops_scheduled(inputs)
});
/**
* | output |
* | --- |
* | "Updated" |
*
* @param {Kraksend_Ops_UpdatedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_updated = /** @type {((inputs?: Kraksend_Ops_UpdatedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_UpdatedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_updated(inputs)
	return __fr.kraksend_ops_updated(inputs)
});
/**
* | output |
* | --- |
* | "Reason / diagnostic" |
*
* @param {Kraksend_Ops_ReasonInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_reason = /** @type {((inputs?: Kraksend_Ops_ReasonInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_ReasonInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_reason(inputs)
	return __fr.kraksend_ops_reason(inputs)
});
/**
* | output |
* | --- |
* | "View delivery" |
*
* @param {Kraksend_Ops_InspectInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_inspect = /** @type {((inputs?: Kraksend_Ops_InspectInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_InspectInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_inspect(inputs)
	return __fr.kraksend_ops_inspect(inputs)
});
/**
* | output |
* | --- |
* | "Correlation" |
*
* @param {Kraksend_Ops_CorrelationInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_correlation = /** @type {((inputs?: Kraksend_Ops_CorrelationInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_CorrelationInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_correlation(inputs)
	return __fr.kraksend_ops_correlation(inputs)
});
/**
* | output |
* | --- |
* | "Pending" |
*
* @param {Kraksend_Ops_PendingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_pending = /** @type {((inputs?: Kraksend_Ops_PendingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_PendingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_pending(inputs)
	return __fr.kraksend_ops_pending(inputs)
});
/**
* | output |
* | --- |
* | "Applied" |
*
* @param {Kraksend_Ops_AppliedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_applied = /** @type {((inputs?: Kraksend_Ops_AppliedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_AppliedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_applied(inputs)
	return __fr.kraksend_ops_applied(inputs)
});
/**
* | output |
* | --- |
* | "Occurred" |
*
* @param {Kraksend_Ops_OccurredInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_occurred = /** @type {((inputs?: Kraksend_Ops_OccurredInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_OccurredInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_occurred(inputs)
	return __fr.kraksend_ops_occurred(inputs)
});
/**
* | output |
* | --- |
* | "Received" |
*
* @param {Kraksend_Ops_ReceivedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_received = /** @type {((inputs?: Kraksend_Ops_ReceivedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_ReceivedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_received(inputs)
	return __fr.kraksend_ops_received(inputs)
});
/**
* | output |
* | --- |
* | "Last checked" |
*
* @param {Kraksend_Ops_CheckedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_checked = /** @type {((inputs?: Kraksend_Ops_CheckedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_CheckedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_checked(inputs)
	return __fr.kraksend_ops_checked(inputs)
});
/**
* | output |
* | --- |
* | "Provider event ID" |
*
* @param {Kraksend_Ops_Event_IdInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_event_id = /** @type {((inputs?: Kraksend_Ops_Event_IdInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_Event_IdInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_event_id(inputs)
	return __fr.kraksend_ops_event_id(inputs)
});
/**
* | output |
* | --- |
* | "Delivery ID" |
*
* @param {Kraksend_Ops_Delivery_IdInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_delivery_id = /** @type {((inputs?: Kraksend_Ops_Delivery_IdInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_Delivery_IdInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_delivery_id(inputs)
	return __fr.kraksend_ops_delivery_id(inputs)
});
/**
* | output |
* | --- |
* | "Contact ID" |
*
* @param {Kraksend_Ops_Contact_IdInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_contact_id = /** @type {((inputs?: Kraksend_Ops_Contact_IdInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_Contact_IdInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_contact_id(inputs)
	return __fr.kraksend_ops_contact_id(inputs)
});
/**
* | output |
* | --- |
* | "Block email endpoint" |
*
* @param {Kraksend_Ops_Add_SuppressionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_add_suppression = /** @type {((inputs?: Kraksend_Ops_Add_SuppressionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_Add_SuppressionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_add_suppression(inputs)
	return __fr.kraksend_ops_add_suppression(inputs)
});
/**
* | output |
* | --- |
* | "Remove suppression" |
*
* @param {Kraksend_Ops_Remove_SuppressionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_remove_suppression = /** @type {((inputs?: Kraksend_Ops_Remove_SuppressionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_Remove_SuppressionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_remove_suppression(inputs)
	return __fr.kraksend_ops_remove_suppression(inputs)
});
/**
* | output |
* | --- |
* | "Blocks apply independently of consent, including transactional email. Removing a block does not subscribe a contact or resend messages. Review bounce/complai..." |
*
* @param {Kraksend_Ops_Suppression_WarningInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_suppression_warning = /** @type {((inputs?: Kraksend_Ops_Suppression_WarningInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_Suppression_WarningInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_suppression_warning(inputs)
	return __fr.kraksend_ops_suppression_warning(inputs)
});
/**
* | output |
* | --- |
* | "Confirm change" |
*
* @param {Kraksend_Ops_ConfirmInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_confirm = /** @type {((inputs?: Kraksend_Ops_ConfirmInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_ConfirmInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_confirm(inputs)
	return __fr.kraksend_ops_confirm(inputs)
});
/**
* | output |
* | --- |
* | "Active" |
*
* @param {Kraksend_Ops_ActiveInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_active = /** @type {((inputs?: Kraksend_Ops_ActiveInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_ActiveInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_active(inputs)
	return __fr.kraksend_ops_active(inputs)
});
/**
* | output |
* | --- |
* | "Expired" |
*
* @param {Kraksend_Ops_ExpiredInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_expired = /** @type {((inputs?: Kraksend_Ops_ExpiredInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_ExpiredInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_expired(inputs)
	return __fr.kraksend_ops_expired(inputs)
});
/**
* | output |
* | --- |
* | "Expires" |
*
* @param {Kraksend_Ops_ExpiresInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_expires = /** @type {((inputs?: Kraksend_Ops_ExpiresInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_ExpiresInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_expires(inputs)
	return __fr.kraksend_ops_expires(inputs)
});
/**
* | output |
* | --- |
* | "Not set" |
*
* @param {Kraksend_Ops_NeverInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_never = /** @type {((inputs?: Kraksend_Ops_NeverInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_NeverInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_never(inputs)
	return __fr.kraksend_ops_never(inputs)
});
/**
* | output |
* | --- |
* | "Purpose" |
*
* @param {Kraksend_Ops_PurposeInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_purpose = /** @type {((inputs?: Kraksend_Ops_PurposeInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_PurposeInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_purpose(inputs)
	return __fr.kraksend_ops_purpose(inputs)
});
/**
* | output |
* | --- |
* | "Actor" |
*
* @param {Kraksend_Ops_ActorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_actor = /** @type {((inputs?: Kraksend_Ops_ActorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_ActorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_actor(inputs)
	return __fr.kraksend_ops_actor(inputs)
});
/**
* | output |
* | --- |
* | "Action" |
*
* @param {Kraksend_Ops_ActionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_action = /** @type {((inputs?: Kraksend_Ops_ActionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_ActionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_action(inputs)
	return __fr.kraksend_ops_action(inputs)
});
/**
* | output |
* | --- |
* | "Blocked" |
*
* @param {Kraksend_Ops_AddInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_add = /** @type {((inputs?: Kraksend_Ops_AddInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_AddInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_add(inputs)
	return __fr.kraksend_ops_add(inputs)
});
/**
* | output |
* | --- |
* | "Unblocked" |
*
* @param {Kraksend_Ops_RemoveInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_remove = /** @type {((inputs?: Kraksend_Ops_RemoveInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_RemoveInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_remove(inputs)
	return __fr.kraksend_ops_remove(inputs)
});
/**
* | output |
* | --- |
* | "Previous suppression reason" |
*
* @param {Kraksend_Ops_Previous_ReasonInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_previous_reason = /** @type {((inputs?: Kraksend_Ops_Previous_ReasonInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_Previous_ReasonInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_previous_reason(inputs)
	return __fr.kraksend_ops_previous_reason(inputs)
});
/**
* | output |
* | --- |
* | "Audit request ID" |
*
* @param {Kraksend_Ops_Request_IdInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_request_id = /** @type {((inputs?: Kraksend_Ops_Request_IdInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_Request_IdInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_request_id(inputs)
	return __fr.kraksend_ops_request_id(inputs)
});
/**
* | output |
* | --- |
* | "Open a campaign's recipients, or enter its campaign ID above, to inspect pending, published and skipped recipients." |
*
* @param {Kraksend_Ops_Recipients_HintInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_recipients_hint = /** @type {((inputs?: Kraksend_Ops_Recipients_HintInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_Recipients_HintInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_recipients_hint(inputs)
	return __fr.kraksend_ops_recipients_hint(inputs)
});
/**
* | output |
* | --- |
* | "Queue generation" |
*
* @param {Kraksend_Ops_GenerationInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_generation = /** @type {((inputs?: Kraksend_Ops_GenerationInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_GenerationInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_generation(inputs)
	return __fr.kraksend_ops_generation(inputs)
});
/**
* | output |
* | --- |
* | "Outcome" |
*
* @param {Kraksend_Ops_OutcomeInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_outcome = /** @type {((inputs?: Kraksend_Ops_OutcomeInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_OutcomeInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_outcome(inputs)
	return __fr.kraksend_ops_outcome(inputs)
});
/**
* | output |
* | --- |
* | "Started" |
*
* @param {Kraksend_Ops_StartedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_started = /** @type {((inputs?: Kraksend_Ops_StartedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_StartedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_started(inputs)
	return __fr.kraksend_ops_started(inputs)
});
/**
* | output |
* | --- |
* | "Completed" |
*
* @param {Kraksend_Ops_CompletedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_completed = /** @type {((inputs?: Kraksend_Ops_CompletedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_CompletedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_completed(inputs)
	return __fr.kraksend_ops_completed(inputs)
});
/**
* | output |
* | --- |
* | "ID" |
*
* @param {Kraksend_Ops_IdInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_id = /** @type {((inputs?: Kraksend_Ops_IdInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_IdInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_id(inputs)
	return __fr.kraksend_ops_id(inputs)
});
/**
* | output |
* | --- |
* | "Retryable failure" |
*
* @param {Kraksend_Ops_Outcome_RetryInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_outcome_retry = /** @type {((inputs?: Kraksend_Ops_Outcome_RetryInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_Outcome_RetryInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_outcome_retry(inputs)
	return __fr.kraksend_ops_outcome_retry(inputs)
});
/**
* | output |
* | --- |
* | "Permanent failure" |
*
* @param {Kraksend_Ops_Outcome_PermanentInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_outcome_permanent = /** @type {((inputs?: Kraksend_Ops_Outcome_PermanentInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_Outcome_PermanentInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_outcome_permanent(inputs)
	return __fr.kraksend_ops_outcome_permanent(inputs)
});
/**
* | output |
* | --- |
* | "Unavailable" |
*
* @param {Kraksend_Ops_Outcome_UnavailableInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_outcome_unavailable = /** @type {((inputs?: Kraksend_Ops_Outcome_UnavailableInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_Outcome_UnavailableInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_outcome_unavailable(inputs)
	return __fr.kraksend_ops_outcome_unavailable(inputs)
});
/**
* | output |
* | --- |
* | "Skipped / deferred" |
*
* @param {Kraksend_Ops_Outcome_SkippedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_outcome_skipped = /** @type {((inputs?: Kraksend_Ops_Outcome_SkippedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_Outcome_SkippedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_outcome_skipped(inputs)
	return __fr.kraksend_ops_outcome_skipped(inputs)
});
/**
* | output |
* | --- |
* | "The operation failed. Refresh and review the latest data before retrying; a suppression may have changed." |
*
* @param {Kraksend_Ops_FailedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_ops_failed = /** @type {((inputs?: Kraksend_Ops_FailedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Ops_FailedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_ops_failed(inputs)
	return __fr.kraksend_ops_failed(inputs)
});
/**
* | output |
* | --- |
* | "Close" |
*
* @param {Kraksend_Campaign_CloseInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_close = /** @type {((inputs?: Kraksend_Campaign_CloseInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_CloseInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_close(inputs)
	return __fr.kraksend_campaign_close(inputs)
});
/**
* | output |
* | --- |
* | "Status" |
*
* @param {Kraksend_Campaign_StatusInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_status = /** @type {((inputs?: Kraksend_Campaign_StatusInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_StatusInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_status(inputs)
	return __fr.kraksend_campaign_status(inputs)
});
/**
* | output |
* | --- |
* | "Campaigns" |
*
* @param {Kraksend_Campaign_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_title = /** @type {((inputs?: Kraksend_Campaign_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_title(inputs)
	return __fr.kraksend_campaign_title(inputs)
});
/**
* | output |
* | --- |
* | "Schedule bilingual email for a snapshot of subscribed contacts. Completed means publication finished, not delivery confirmed." |
*
* @param {Kraksend_Campaign_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_description = /** @type {((inputs?: Kraksend_Campaign_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_description(inputs)
	return __fr.kraksend_campaign_description(inputs)
});
/**
* | output |
* | --- |
* | "Create campaign" |
*
* @param {Kraksend_Campaign_CreateInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_create = /** @type {((inputs?: Kraksend_Campaign_CreateInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_CreateInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_create(inputs)
	return __fr.kraksend_campaign_create(inputs)
});
/**
* | output |
* | --- |
* | "Verified sender email" |
*
* @param {Kraksend_Campaign_FromInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_from = /** @type {((inputs?: Kraksend_Campaign_FromInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_FromInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_from(inputs)
	return __fr.kraksend_campaign_from(inputs)
});
/**
* | output |
* | --- |
* | "Subject" |
*
* @param {Kraksend_Campaign_SubjectInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_subject = /** @type {((inputs?: Kraksend_Campaign_SubjectInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_SubjectInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_subject(inputs)
	return __fr.kraksend_campaign_subject(inputs)
});
/**
* | output |
* | --- |
* | "Message" |
*
* @param {Kraksend_Campaign_TextInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_text = /** @type {((inputs?: Kraksend_Campaign_TextInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_TextInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_text(inputs)
	return __fr.kraksend_campaign_text(inputs)
});
/**
* | output |
* | --- |
* | "Manage" |
*
* @param {Kraksend_Campaign_ManageInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_manage = /** @type {((inputs?: Kraksend_Campaign_ManageInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_ManageInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_manage(inputs)
	return __fr.kraksend_campaign_manage(inputs)
});
/**
* | output |
* | --- |
* | "Schedule" |
*
* @param {Kraksend_Campaign_ScheduleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_schedule = /** @type {((inputs?: Kraksend_Campaign_ScheduleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_ScheduleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_schedule(inputs)
	return __fr.kraksend_campaign_schedule(inputs)
});
/**
* | output |
* | --- |
* | "Send at (ISO date with timezone)" |
*
* @param {Kraksend_Campaign_Scheduled_ForInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_scheduled_for = /** @type {((inputs?: Kraksend_Campaign_Scheduled_ForInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_Scheduled_ForInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_scheduled_for(inputs)
	return __fr.kraksend_campaign_scheduled_for(inputs)
});
/**
* | output |
* | --- |
* | "Pause" |
*
* @param {Kraksend_Campaign_PauseInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_pause = /** @type {((inputs?: Kraksend_Campaign_PauseInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_PauseInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_pause(inputs)
	return __fr.kraksend_campaign_pause(inputs)
});
/**
* | output |
* | --- |
* | "Resume" |
*
* @param {Kraksend_Campaign_ResumeInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_resume = /** @type {((inputs?: Kraksend_Campaign_ResumeInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_ResumeInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_resume(inputs)
	return __fr.kraksend_campaign_resume(inputs)
});
/**
* | output |
* | --- |
* | "Cancel campaign" |
*
* @param {Kraksend_Campaign_CancelInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_cancel = /** @type {((inputs?: Kraksend_Campaign_CancelInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_CancelInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_cancel(inputs)
	return __fr.kraksend_campaign_cancel(inputs)
});
/**
* | output |
* | --- |
* | "Confirm cancellation" |
*
* @param {Kraksend_Campaign_Confirm_CancelInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_confirm_cancel = /** @type {((inputs?: Kraksend_Campaign_Confirm_CancelInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_Confirm_CancelInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_confirm_cancel(inputs)
	return __fr.kraksend_campaign_confirm_cancel(inputs)
});
/**
* | output |
* | --- |
* | "Pending messages will be blocked. Messages already accepted by the provider cannot be recalled." |
*
* @param {Kraksend_Campaign_Cancel_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_cancel_description = /** @type {((inputs?: Kraksend_Campaign_Cancel_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_Cancel_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_cancel_description(inputs)
	return __fr.kraksend_campaign_cancel_description(inputs)
});
/**
* | output |
* | --- |
* | "No campaigns yet." |
*
* @param {Kraksend_Campaign_EmptyInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_empty = /** @type {((inputs?: Kraksend_Campaign_EmptyInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_EmptyInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_empty(inputs)
	return __fr.kraksend_campaign_empty(inputs)
});
/**
* | output |
* | --- |
* | "Delivery report" |
*
* @param {Kraksend_Campaign_ReportingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_reporting = /** @type {((inputs?: Kraksend_Campaign_ReportingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_ReportingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_reporting(inputs)
	return __fr.kraksend_campaign_reporting(inputs)
});
/**
* | output |
* | --- |
* | "Draft" |
*
* @param {Kraksend_Campaign_DraftInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_draft = /** @type {((inputs?: Kraksend_Campaign_DraftInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_DraftInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_draft(inputs)
	return __fr.kraksend_campaign_draft(inputs)
});
/**
* | output |
* | --- |
* | "Scheduled" |
*
* @param {Kraksend_Campaign_ScheduledInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_scheduled = /** @type {((inputs?: Kraksend_Campaign_ScheduledInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_ScheduledInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_scheduled(inputs)
	return __fr.kraksend_campaign_scheduled(inputs)
});
/**
* | output |
* | --- |
* | "Publishing" |
*
* @param {Kraksend_Campaign_RunningInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_running = /** @type {((inputs?: Kraksend_Campaign_RunningInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_RunningInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_running(inputs)
	return __fr.kraksend_campaign_running(inputs)
});
/**
* | output |
* | --- |
* | "Paused" |
*
* @param {Kraksend_Campaign_PausedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_paused = /** @type {((inputs?: Kraksend_Campaign_PausedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_PausedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_paused(inputs)
	return __fr.kraksend_campaign_paused(inputs)
});
/**
* | output |
* | --- |
* | "Cancelled" |
*
* @param {Kraksend_Campaign_CancelledInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_cancelled = /** @type {((inputs?: Kraksend_Campaign_CancelledInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_CancelledInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_cancelled(inputs)
	return __fr.kraksend_campaign_cancelled(inputs)
});
/**
* | output |
* | --- |
* | "Publication completed" |
*
* @param {Kraksend_Campaign_CompletedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_completed = /** @type {((inputs?: Kraksend_Campaign_CompletedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_CompletedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_completed(inputs)
	return __fr.kraksend_campaign_completed(inputs)
});
/**
* | output |
* | --- |
* | "Snapshot recipients" |
*
* @param {Kraksend_Campaign_AudienceInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_audience = /** @type {((inputs?: Kraksend_Campaign_AudienceInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_AudienceInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_audience(inputs)
	return __fr.kraksend_campaign_audience(inputs)
});
/**
* | output |
* | --- |
* | "Pending publication" |
*
* @param {Kraksend_Campaign_PendingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_pending = /** @type {((inputs?: Kraksend_Campaign_PendingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_PendingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_pending(inputs)
	return __fr.kraksend_campaign_pending(inputs)
});
/**
* | output |
* | --- |
* | "Published" |
*
* @param {Kraksend_Campaign_PublishedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_published = /** @type {((inputs?: Kraksend_Campaign_PublishedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_PublishedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_published(inputs)
	return __fr.kraksend_campaign_published(inputs)
});
/**
* | output |
* | --- |
* | "Skipped" |
*
* @param {Kraksend_Campaign_SkippedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_skipped = /** @type {((inputs?: Kraksend_Campaign_SkippedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_SkippedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_skipped(inputs)
	return __fr.kraksend_campaign_skipped(inputs)
});
/**
* | output |
* | --- |
* | "Provider accepted" |
*
* @param {Kraksend_Campaign_AcceptedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_accepted = /** @type {((inputs?: Kraksend_Campaign_AcceptedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_AcceptedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_accepted(inputs)
	return __fr.kraksend_campaign_accepted(inputs)
});
/**
* | output |
* | --- |
* | "Failed" |
*
* @param {Kraksend_Campaign_FailedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_failed = /** @type {((inputs?: Kraksend_Campaign_FailedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_FailedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_failed(inputs)
	return __fr.kraksend_campaign_failed(inputs)
});
/**
* | output |
* | --- |
* | "Suppressed" |
*
* @param {Kraksend_Campaign_SuppressedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_suppressed = /** @type {((inputs?: Kraksend_Campaign_SuppressedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_SuppressedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_suppressed(inputs)
	return __fr.kraksend_campaign_suppressed(inputs)
});
/**
* | output |
* | --- |
* | "Provider confirmed delivery" |
*
* @param {Kraksend_Campaign_ConfirmedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_confirmed = /** @type {((inputs?: Kraksend_Campaign_ConfirmedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_ConfirmedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_confirmed(inputs)
	return __fr.kraksend_campaign_confirmed(inputs)
});
/**
* | output |
* | --- |
* | "Hard bounced" |
*
* @param {Kraksend_Campaign_Hard_BouncedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_hard_bounced = /** @type {((inputs?: Kraksend_Campaign_Hard_BouncedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_Hard_BouncedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_hard_bounced(inputs)
	return __fr.kraksend_campaign_hard_bounced(inputs)
});
/**
* | output |
* | --- |
* | "Complaints" |
*
* @param {Kraksend_Campaign_ComplainedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_complained = /** @type {((inputs?: Kraksend_Campaign_ComplainedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_ComplainedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_complained(inputs)
	return __fr.kraksend_campaign_complained(inputs)
});
/**
* | output |
* | --- |
* | "English" |
*
* @param {Kraksend_Campaign_EnglishInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_english = /** @type {((inputs?: Kraksend_Campaign_EnglishInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_EnglishInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_english(inputs)
	return __fr.kraksend_campaign_english(inputs)
});
/**
* | output |
* | --- |
* | "French" |
*
* @param {Kraksend_Campaign_FrenchInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_campaign_french = /** @type {((inputs?: Kraksend_Campaign_FrenchInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Campaign_FrenchInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_campaign_french(inputs)
	return __fr.kraksend_campaign_french(inputs)
});
/**
* | output |
* | --- |
* | "Unsubscribe from optional email" |
*
* @param {Kraksend_Unsubscribe_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_unsubscribe_title = /** @type {((inputs?: Kraksend_Unsubscribe_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Unsubscribe_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_unsubscribe_title(inputs)
	return __fr.kraksend_unsubscribe_title(inputs)
});
/**
* | output |
* | --- |
* | "Stop optional email for this contact in this application. Essential emails, such as password resets, will continue." |
*
* @param {Kraksend_Unsubscribe_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_unsubscribe_description = /** @type {((inputs?: Kraksend_Unsubscribe_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Unsubscribe_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_unsubscribe_description(inputs)
	return __fr.kraksend_unsubscribe_description(inputs)
});
/**
* | output |
* | --- |
* | "This unsubscribe link is invalid or has expired." |
*
* @param {Kraksend_Unsubscribe_InvalidInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_unsubscribe_invalid = /** @type {((inputs?: Kraksend_Unsubscribe_InvalidInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Unsubscribe_InvalidInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_unsubscribe_invalid(inputs)
	return __fr.kraksend_unsubscribe_invalid(inputs)
});
/**
* | output |
* | --- |
* | "We could not save your choice. Please try again." |
*
* @param {Kraksend_Unsubscribe_UnavailableInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_unsubscribe_unavailable = /** @type {((inputs?: Kraksend_Unsubscribe_UnavailableInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Unsubscribe_UnavailableInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_unsubscribe_unavailable(inputs)
	return __fr.kraksend_unsubscribe_unavailable(inputs)
});
/**
* | output |
* | --- |
* | "You have unsubscribed from optional email for this application." |
*
* @param {Kraksend_Unsubscribe_SuccessInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_unsubscribe_success = /** @type {((inputs?: Kraksend_Unsubscribe_SuccessInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Unsubscribe_SuccessInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_unsubscribe_success(inputs)
	return __fr.kraksend_unsubscribe_success(inputs)
});
/**
* | output |
* | --- |
* | "Notification contacts" |
*
* @param {Kraksend_Contacts_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_contacts_title = /** @type {((inputs?: Kraksend_Contacts_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Contacts_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_contacts_title(inputs)
	return __fr.kraksend_contacts_title(inputs)
});
/**
* | output |
* | --- |
* | "Manage recipients for this application. Creating a contact does not subscribe it to optional email." |
*
* @param {Kraksend_Contacts_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_contacts_description = /** @type {((inputs?: Kraksend_Contacts_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Contacts_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_contacts_description(inputs)
	return __fr.kraksend_contacts_description(inputs)
});
/**
* | output |
* | --- |
* | "Add contact" |
*
* @param {Kraksend_Contacts_CreateInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_contacts_create = /** @type {((inputs?: Kraksend_Contacts_CreateInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Contacts_CreateInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_contacts_create(inputs)
	return __fr.kraksend_contacts_create(inputs)
});
/**
* | output |
* | --- |
* | "Name" |
*
* @param {Kraksend_Contacts_NameInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_contacts_name = /** @type {((inputs?: Kraksend_Contacts_NameInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Contacts_NameInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_contacts_name(inputs)
	return __fr.kraksend_contacts_name(inputs)
});
/**
* | output |
* | --- |
* | "Email" |
*
* @param {Kraksend_Contacts_EmailInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_contacts_email = /** @type {((inputs?: Kraksend_Contacts_EmailInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Contacts_EmailInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_contacts_email(inputs)
	return __fr.kraksend_contacts_email(inputs)
});
/**
* | output |
* | --- |
* | "Optional email consent" |
*
* @param {Kraksend_Contacts_ConsentInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_contacts_consent = /** @type {((inputs?: Kraksend_Contacts_ConsentInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Contacts_ConsentInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_contacts_consent(inputs)
	return __fr.kraksend_contacts_consent(inputs)
});
/**
* | output |
* | --- |
* | "No consent recorded" |
*
* @param {Kraksend_Contacts_UnknownInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_contacts_unknown = /** @type {((inputs?: Kraksend_Contacts_UnknownInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Contacts_UnknownInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_contacts_unknown(inputs)
	return __fr.kraksend_contacts_unknown(inputs)
});
/**
* | output |
* | --- |
* | "Subscribed" |
*
* @param {Kraksend_Contacts_SubscribedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_contacts_subscribed = /** @type {((inputs?: Kraksend_Contacts_SubscribedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Contacts_SubscribedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_contacts_subscribed(inputs)
	return __fr.kraksend_contacts_subscribed(inputs)
});
/**
* | output |
* | --- |
* | "Unsubscribed" |
*
* @param {Kraksend_Contacts_UnsubscribedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_contacts_unsubscribed = /** @type {((inputs?: Kraksend_Contacts_UnsubscribedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Contacts_UnsubscribedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_contacts_unsubscribed(inputs)
	return __fr.kraksend_contacts_unsubscribed(inputs)
});
/**
* | output |
* | --- |
* | "Unsubscribe" |
*
* @param {Kraksend_Contacts_WithdrawInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_contacts_withdraw = /** @type {((inputs?: Kraksend_Contacts_WithdrawInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Contacts_WithdrawInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_contacts_withdraw(inputs)
	return __fr.kraksend_contacts_withdraw(inputs)
});
/**
* | output |
* | --- |
* | "Save contact" |
*
* @param {Kraksend_Contacts_SaveInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_contacts_save = /** @type {((inputs?: Kraksend_Contacts_SaveInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Contacts_SaveInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_contacts_save(inputs)
	return __fr.kraksend_contacts_save(inputs)
});
/**
* | output |
* | --- |
* | "We could not complete this operation. Please try again." |
*
* @param {Kraksend_Contacts_FailedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_contacts_failed = /** @type {((inputs?: Kraksend_Contacts_FailedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Contacts_FailedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_contacts_failed(inputs)
	return __fr.kraksend_contacts_failed(inputs)
});
/**
* | output |
* | --- |
* | "Loading contacts…" |
*
* @param {Kraksend_Contacts_LoadingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_contacts_loading = /** @type {((inputs?: Kraksend_Contacts_LoadingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Contacts_LoadingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_contacts_loading(inputs)
	return __fr.kraksend_contacts_loading(inputs)
});
/**
* | output |
* | --- |
* | "No contacts yet." |
*
* @param {Kraksend_Contacts_EmptyInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_contacts_empty = /** @type {((inputs?: Kraksend_Contacts_EmptyInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Contacts_EmptyInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_contacts_empty(inputs)
	return __fr.kraksend_contacts_empty(inputs)
});
/**
* | output |
* | --- |
* | "Previous" |
*
* @param {Kraksend_Contacts_PreviousInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_contacts_previous = /** @type {((inputs?: Kraksend_Contacts_PreviousInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Contacts_PreviousInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_contacts_previous(inputs)
	return __fr.kraksend_contacts_previous(inputs)
});
/**
* | output |
* | --- |
* | "Next" |
*
* @param {Kraksend_Contacts_NextInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const kraksend_contacts_next = /** @type {((inputs?: Kraksend_Contacts_NextInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Kraksend_Contacts_NextInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.kraksend_contacts_next(inputs)
	return __fr.kraksend_contacts_next(inputs)
});
/**
* | output |
* | --- |
* | "Color Picker" |
*
* @param {Color_Picker_Preview_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const color_picker_preview_title = /** @type {((inputs?: Color_Picker_Preview_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Color_Picker_Preview_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.color_picker_preview_title(inputs)
	return __fr.color_picker_preview_title(inputs)
});
/**
* | output |
* | --- |
* | "Enter a HEX code or click the swatch to choose a color visually." |
*
* @param {Color_Picker_Preview_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const color_picker_preview_description = /** @type {((inputs?: Color_Picker_Preview_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Color_Picker_Preview_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.color_picker_preview_description(inputs)
	return __fr.color_picker_preview_description(inputs)
});
/**
* | output |
* | --- |
* | "Disabled color picker" |
*
* @param {Color_Picker_Preview_DisabledInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const color_picker_preview_disabled = /** @type {((inputs?: Color_Picker_Preview_DisabledInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Color_Picker_Preview_DisabledInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.color_picker_preview_disabled(inputs)
	return __fr.color_picker_preview_disabled(inputs)
});
/**
* | output |
* | --- |
* | "Unsubscribe from email notifications" |
*
* @param {Notification_Unsubscribe_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const notification_unsubscribe_title = /** @type {((inputs?: Notification_Unsubscribe_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notification_Unsubscribe_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.notification_unsubscribe_title(inputs)
	return __fr.notification_unsubscribe_title(inputs)
});
/**
* | output |
* | --- |
* | "Stop all optional notification emails for your account across all organizations and workspaces. Password resets and other essential emails will continue. In-..." |
*
* @param {Notification_Unsubscribe_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const notification_unsubscribe_description = /** @type {((inputs?: Notification_Unsubscribe_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notification_Unsubscribe_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.notification_unsubscribe_description(inputs)
	return __fr.notification_unsubscribe_description(inputs)
});
/**
* | output |
* | --- |
* | "Unsubscribe" |
*
* @param {Notification_Unsubscribe_ActionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const notification_unsubscribe_action = /** @type {((inputs?: Notification_Unsubscribe_ActionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notification_Unsubscribe_ActionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.notification_unsubscribe_action(inputs)
	return __fr.notification_unsubscribe_action(inputs)
});
/**
* | output |
* | --- |
* | "You have unsubscribed from optional email notifications." |
*
* @param {Notification_Unsubscribe_SuccessInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const notification_unsubscribe_success = /** @type {((inputs?: Notification_Unsubscribe_SuccessInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notification_Unsubscribe_SuccessInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.notification_unsubscribe_success(inputs)
	return __fr.notification_unsubscribe_success(inputs)
});
/**
* | output |
* | --- |
* | "This unsubscribe link is invalid or has expired. Use a link from a more recent email or manage notifications in your account." |
*
* @param {Notification_Unsubscribe_InvalidInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const notification_unsubscribe_invalid = /** @type {((inputs?: Notification_Unsubscribe_InvalidInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notification_Unsubscribe_InvalidInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.notification_unsubscribe_invalid(inputs)
	return __fr.notification_unsubscribe_invalid(inputs)
});
/**
* | output |
* | --- |
* | "We could not save your unsubscribe request. Please try again later." |
*
* @param {Notification_Unsubscribe_UnavailableInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const notification_unsubscribe_unavailable = /** @type {((inputs?: Notification_Unsubscribe_UnavailableInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notification_Unsubscribe_UnavailableInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.notification_unsubscribe_unavailable(inputs)
	return __fr.notification_unsubscribe_unavailable(inputs)
});
/**
* | output |
* | --- |
* | "Unsubscribe from email notifications" |
*
* @param {Notification_Unsubscribe_FooterInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const notification_unsubscribe_footer = /** @type {((inputs?: Notification_Unsubscribe_FooterInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Notification_Unsubscribe_FooterInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.notification_unsubscribe_footer(inputs)
	return __fr.notification_unsubscribe_footer(inputs)
});
/**
* | output |
* | --- |
* | "Choose a scenario, then open the assistant. All tool calls and responses are simulated; no data is read or changed. Try @ references, removing context, stopp..." |
*
* @param {Agent_Preview_Demo_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const agent_preview_demo_description = /** @type {((inputs?: Agent_Preview_Demo_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Agent_Preview_Demo_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.agent_preview_demo_description(inputs)
	return __fr.agent_preview_demo_description(inputs)
});
/**
* | output |
* | --- |
* | "Show me the {scenario} demo." |
*
* @param {Agent_Preview_Demo_PromptInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const agent_preview_demo_prompt = /** @type {((inputs: Agent_Preview_Demo_PromptInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Agent_Preview_Demo_PromptInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.agent_preview_demo_prompt(inputs)
	return __fr.agent_preview_demo_prompt(inputs)
});
/**
* | output |
* | --- |
* | "Conversation" |
*
* @param {Agent_Preview_ChatInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const agent_preview_chat = /** @type {((inputs?: Agent_Preview_ChatInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Agent_Preview_ChatInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.agent_preview_chat(inputs)
	return __fr.agent_preview_chat(inputs)
});
/**
* | output |
* | --- |
* | "Tool chain" |
*
* @param {Agent_Preview_ToolsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const agent_preview_tools = /** @type {((inputs?: Agent_Preview_ToolsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Agent_Preview_ToolsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.agent_preview_tools(inputs)
	return __fr.agent_preview_tools(inputs)
});
/**
* | output |
* | --- |
* | "Approval" |
*
* @param {Agent_Preview_ApprovalInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const agent_preview_approval = /** @type {((inputs?: Agent_Preview_ApprovalInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Agent_Preview_ApprovalInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.agent_preview_approval(inputs)
	return __fr.agent_preview_approval(inputs)
});
/**
* | output |
* | --- |
* | "Destructive action" |
*
* @param {Agent_Preview_DestructiveInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const agent_preview_destructive = /** @type {((inputs?: Agent_Preview_DestructiveInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Agent_Preview_DestructiveInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.agent_preview_destructive(inputs)
	return __fr.agent_preview_destructive(inputs)
});
/**
* | output |
* | --- |
* | "Failed tool" |
*
* @param {Agent_Preview_FailureInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const agent_preview_failure = /** @type {((inputs?: Agent_Preview_FailureInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Agent_Preview_FailureInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.agent_preview_failure(inputs)
	return __fr.agent_preview_failure(inputs)
});
/**
* | output |
* | --- |
* | "Service error" |
*
* @param {Agent_Preview_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const agent_preview_error = /** @type {((inputs?: Agent_Preview_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Agent_Preview_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.agent_preview_error(inputs)
	return __fr.agent_preview_error(inputs)
});
/**
* | output |
* | --- |
* | "Formatted response" |
*
* @param {Agent_Preview_MarkdownInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const agent_preview_markdown = /** @type {((inputs?: Agent_Preview_MarkdownInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Agent_Preview_MarkdownInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.agent_preview_markdown(inputs)
	return __fr.agent_preview_markdown(inputs)
});
/**
* | output |
* | --- |
* | "Simulated tool call using sample data only. No external service is contacted." |
*
* @param {Agent_Preview_Tool_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const agent_preview_tool_description = /** @type {((inputs?: Agent_Preview_Tool_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Agent_Preview_Tool_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.agent_preview_tool_description(inputs)
	return __fr.agent_preview_tool_description(inputs)
});
/**
* | output |
* | --- |
* | "Search resources" |
*
* @param {Agent_Preview_Search_ToolInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const agent_preview_search_tool = /** @type {((inputs?: Agent_Preview_Search_ToolInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Agent_Preview_Search_ToolInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.agent_preview_search_tool(inputs)
	return __fr.agent_preview_search_tool(inputs)
});
/**
* | output |
* | --- |
* | "Read onboarding guide" |
*
* @param {Agent_Preview_Read_ToolInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const agent_preview_read_tool = /** @type {((inputs?: Agent_Preview_Read_ToolInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Agent_Preview_Read_ToolInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.agent_preview_read_tool(inputs)
	return __fr.agent_preview_read_tool(inputs)
});
/**
* | output |
* | --- |
* | "Update onboarding draft" |
*
* @param {Agent_Preview_Update_ToolInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const agent_preview_update_tool = /** @type {((inputs?: Agent_Preview_Update_ToolInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Agent_Preview_Update_ToolInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.agent_preview_update_tool(inputs)
	return __fr.agent_preview_update_tool(inputs)
});
/**
* | output |
* | --- |
* | "Delete onboarding draft" |
*
* @param {Agent_Preview_Delete_ToolInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const agent_preview_delete_tool = /** @type {((inputs?: Agent_Preview_Delete_ToolInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Agent_Preview_Delete_ToolInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.agent_preview_delete_tool(inputs)
	return __fr.agent_preview_delete_tool(inputs)
});
/**
* | output |
* | --- |
* | "I found 3 matching resources and read the onboarding guide. It contains 4 sections: introduction, setup, first task, and next steps. I'd recommend adding a s..." |
*
* @param {Agent_Preview_Tools_ResponseInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const agent_preview_tools_response = /** @type {((inputs?: Agent_Preview_Tools_ResponseInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Agent_Preview_Tools_ResponseInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.agent_preview_tools_response(inputs)
	return __fr.agent_preview_tools_response(inputs)
});
/**
* | output |
* | --- |
* | "The search succeeded, but reading the guide failed in this simulation. You can try the tool chain demo again, or provide another resource with @. No data was..." |
*
* @param {Agent_Preview_Tool_Failure_ResponseInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const agent_preview_tool_failure_response = /** @type {((inputs?: Agent_Preview_Tool_Failure_ResponseInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Agent_Preview_Tool_Failure_ResponseInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.agent_preview_tool_failure_response(inputs)
	return __fr.agent_preview_tool_failure_response(inputs)
});
/**
* | output |
* | --- |
* | "Approved! The simulated action completed successfully. In a connected application, the tool result would now be available to the assistant. No real data was ..." |
*
* @param {Agent_Preview_Approved_ResponseInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const agent_preview_approved_response = /** @type {((inputs?: Agent_Preview_Approved_ResponseInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Agent_Preview_Approved_ResponseInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.agent_preview_approved_response(inputs)
	return __fr.agent_preview_approved_response(inputs)
});
/**
* | output |
* | --- |
* | "Cancelled. I won't carry out that action. You can send a different request or choose another demo. No data was changed." |
*
* @param {Agent_Preview_Denied_ResponseInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const agent_preview_denied_response = /** @type {((inputs?: Agent_Preview_Denied_ResponseInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Agent_Preview_Denied_ResponseInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.agent_preview_denied_response(inputs)
	return __fr.agent_preview_denied_response(inputs)
});
/**
* | output |
* | --- |
* | "Here's a formatted response with a code example you can copy." |
*
* @param {Agent_Preview_Markdown_ResponseInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const agent_preview_markdown_response = /** @type {((inputs?: Agent_Preview_Markdown_ResponseInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Agent_Preview_Markdown_ResponseInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.agent_preview_markdown_response(inputs)
	return __fr.agent_preview_markdown_response(inputs)
});
/**
* | output |
* | --- |
* | "Use references to give the assistant relevant context. This example is illustrative and does not execute any code." |
*
* @param {Agent_Preview_Markdown_ItemInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const agent_preview_markdown_item = /** @type {((inputs?: Agent_Preview_Markdown_ItemInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Agent_Preview_Markdown_ItemInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.agent_preview_markdown_item(inputs)
	return __fr.agent_preview_markdown_item(inputs)
});
/**
* | output |
* | --- |
* | "Hello! This is a simulated assistant response—no AI service is connected. I can help you explore the widget, draft a plan, or work with a reference. Try typi..." |
*
* @param {Agent_Preview_Response_IntroInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const agent_preview_response_intro = /** @type {((inputs?: Agent_Preview_Response_IntroInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Agent_Preview_Response_IntroInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.agent_preview_response_intro(inputs)
	return __fr.agent_preview_response_intro(inputs)
});
/**
* | output |
* | --- |
* | "Here's a sample plan: 1. Define the goal and gather the relevant resources. 2. Break the work into small, reviewable steps. 3. Review the result before makin..." |
*
* @param {Agent_Preview_Response_PlanInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const agent_preview_response_plan = /** @type {((inputs?: Agent_Preview_Response_PlanInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Agent_Preview_Response_PlanInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.agent_preview_response_plan(inputs)
	return __fr.agent_preview_response_plan(inputs)
});
/**
* | output |
* | --- |
* | "Ready for the next step? Add more detail to your request, or mention a resource with @. This preview only simulates replies; it doesn't read or change any data." |
*
* @param {Agent_Preview_Response_FollowupInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const agent_preview_response_followup = /** @type {((inputs?: Agent_Preview_Response_FollowupInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Agent_Preview_Response_FollowupInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.agent_preview_response_followup(inputs)
	return __fr.agent_preview_response_followup(inputs)
});
/**
* | output |
* | --- |
* | "You've attached these references: {references}. In a connected application, I could use them to tailor my answer. For this demo, imagine a summary of the key..." |
*
* @param {Agent_Preview_Response_ReferencesInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const agent_preview_response_references = /** @type {((inputs: Agent_Preview_Response_ReferencesInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Agent_Preview_Response_ReferencesInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.agent_preview_response_references(inputs)
	return __fr.agent_preview_response_references(inputs)
});
/**
* | output |
* | --- |
* | "Preview image" |
*
* @param {Effect_Form_Preview_Image_LabelInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const effect_form_preview_image_label = /** @type {((inputs?: Effect_Form_Preview_Image_LabelInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Effect_Form_Preview_Image_LabelInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.effect_form_preview_image_label(inputs)
	return __fr.effect_form_preview_image_label(inputs)
});
/**
* | output |
* | --- |
* | "Yes" |
*
* @param {Data_Table_Preview_TrueInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const data_table_preview_true = /** @type {((inputs?: Data_Table_Preview_TrueInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Data_Table_Preview_TrueInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.data_table_preview_true(inputs)
	return __fr.data_table_preview_true(inputs)
});
/**
* | output |
* | --- |
* | "No" |
*
* @param {Data_Table_Preview_FalseInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const data_table_preview_false = /** @type {((inputs?: Data_Table_Preview_FalseInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Data_Table_Preview_FalseInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.data_table_preview_false(inputs)
	return __fr.data_table_preview_false(inputs)
});
/**
* | output |
* | --- |
* | "Shipped" |
*
* @param {Data_Table_Preview_ShippedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const data_table_preview_shipped = /** @type {((inputs?: Data_Table_Preview_ShippedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Data_Table_Preview_ShippedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.data_table_preview_shipped(inputs)
	return __fr.data_table_preview_shipped(inputs)
});
/**
* | output |
* | --- |
* | "Toggle boolean for {row}" |
*
* @param {Data_Table_Preview_Toggle_BooleanInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const data_table_preview_toggle_boolean = /** @type {((inputs: Data_Table_Preview_Toggle_BooleanInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Data_Table_Preview_Toggle_BooleanInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.data_table_preview_toggle_boolean(inputs)
	return __fr.data_table_preview_toggle_boolean(inputs)
});
/**
* | output |
* | --- |
* | "Kitchen sink" |
*
* @param {Data_Table_Preview_Kitchen_SinkInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const data_table_preview_kitchen_sink = /** @type {((inputs?: Data_Table_Preview_Kitchen_SinkInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Data_Table_Preview_Kitchen_SinkInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.data_table_preview_kitchen_sink(inputs)
	return __fr.data_table_preview_kitchen_sink(inputs)
});
/**
* | output |
* | --- |
* | "Custom cells, grouping, selection, row actions, reordering, gallery view, and export in one table." |
*
* @param {Data_Table_Preview_Kitchen_Sink_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const data_table_preview_kitchen_sink_description = /** @type {((inputs?: Data_Table_Preview_Kitchen_Sink_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Data_Table_Preview_Kitchen_Sink_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.data_table_preview_kitchen_sink_description(inputs)
	return __fr.data_table_preview_kitchen_sink_description(inputs)
});
/**
* | output |
* | --- |
* | "Column types" |
*
* @param {Data_Table_Preview_Column_TypesInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const data_table_preview_column_types = /** @type {((inputs?: Data_Table_Preview_Column_TypesInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Data_Table_Preview_Column_TypesInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.data_table_preview_column_types(inputs)
	return __fr.data_table_preview_column_types(inputs)
});
/**
* | output |
* | --- |
* | "Each column demonstrates its named type, including empty values. Date-times use UTC. Lists can display names or icons. Toggle a boolean or open an editable l..." |
*
* @param {Data_Table_Preview_Column_Types_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const data_table_preview_column_types_description = /** @type {((inputs?: Data_Table_Preview_Column_Types_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Data_Table_Preview_Column_Types_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.data_table_preview_column_types_description(inputs)
	return __fr.data_table_preview_column_types_description(inputs)
});
/**
* | output |
* | --- |
* | "No items" |
*
* @param {Data_Table_Preview_No_ItemsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const data_table_preview_no_items = /** @type {((inputs?: Data_Table_Preview_No_ItemsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Data_Table_Preview_No_ItemsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.data_table_preview_no_items(inputs)
	return __fr.data_table_preview_no_items(inputs)
});
/**
* | output |
* | --- |
* | "Manage members" |
*
* @param {Data_Table_Preview_Manage_MembersInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const data_table_preview_manage_members = /** @type {((inputs?: Data_Table_Preview_Manage_MembersInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Data_Table_Preview_Manage_MembersInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.data_table_preview_manage_members(inputs)
	return __fr.data_table_preview_manage_members(inputs)
});
/**
* | output |
* | --- |
* | "Member actions" |
*
* @param {Data_Table_Preview_Member_ActionsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const data_table_preview_member_actions = /** @type {((inputs?: Data_Table_Preview_Member_ActionsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Data_Table_Preview_Member_ActionsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.data_table_preview_member_actions(inputs)
	return __fr.data_table_preview_member_actions(inputs)
});
/**
* | output |
* | --- |
* | "User" |
*
* @param {Data_Table_Preview_UserInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const data_table_preview_user = /** @type {((inputs?: Data_Table_Preview_UserInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Data_Table_Preview_UserInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.data_table_preview_user(inputs)
	return __fr.data_table_preview_user(inputs)
});
/**
* | output |
* | --- |
* | "Impersonate" |
*
* @param {Data_Table_Preview_ImpersonateInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const data_table_preview_impersonate = /** @type {((inputs?: Data_Table_Preview_ImpersonateInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Data_Table_Preview_ImpersonateInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.data_table_preview_impersonate(inputs)
	return __fr.data_table_preview_impersonate(inputs)
});
/**
* | output |
* | --- |
* | "Ban" |
*
* @param {Data_Table_Preview_BanInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const data_table_preview_ban = /** @type {((inputs?: Data_Table_Preview_BanInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Data_Table_Preview_BanInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.data_table_preview_ban(inputs)
	return __fr.data_table_preview_ban(inputs)
});
/**
* | output |
* | --- |
* | "{action} selected for {name} in row {row}." |
*
* @param {Data_Table_Preview_Member_Action_StatusInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const data_table_preview_member_action_status = /** @type {((inputs: Data_Table_Preview_Member_Action_StatusInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Data_Table_Preview_Member_Action_StatusInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.data_table_preview_member_action_status(inputs)
	return __fr.data_table_preview_member_action_status(inputs)
});
/**
* | output |
* | --- |
* | "List (icons)" |
*
* @param {Data_Table_Preview_List_IconsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const data_table_preview_list_icons = /** @type {((inputs?: Data_Table_Preview_List_IconsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Data_Table_Preview_List_IconsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.data_table_preview_list_icons(inputs)
	return __fr.data_table_preview_list_icons(inputs)
});
/**
* | output |
* | --- |
* | "List (editable)" |
*
* @param {Data_Table_Preview_List_EditableInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const data_table_preview_list_editable = /** @type {((inputs?: Data_Table_Preview_List_EditableInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Data_Table_Preview_List_EditableInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.data_table_preview_list_editable(inputs)
	return __fr.data_table_preview_list_editable(inputs)
});
/**
* | output |
* | --- |
* | "Members" |
*
* @param {Data_Table_Preview_MembersInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const data_table_preview_members = /** @type {((inputs?: Data_Table_Preview_MembersInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Data_Table_Preview_MembersInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.data_table_preview_members(inputs)
	return __fr.data_table_preview_members(inputs)
});
/**
* | output |
* | --- |
* | "Updated at (UTC)" |
*
* @param {Data_Table_Preview_Updated_AtInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const data_table_preview_updated_at = /** @type {((inputs?: Data_Table_Preview_Updated_AtInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Data_Table_Preview_Updated_AtInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.data_table_preview_updated_at(inputs)
	return __fr.data_table_preview_updated_at(inputs)
});
/**
* | output |
* | --- |
* | "Error Component" |
*
* @param {Error_Preview_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const error_preview_title = /** @type {((inputs?: Error_Preview_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Error_Preview_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.error_preview_title(inputs)
	return __fr.error_preview_title(inputs)
});
/**
* | output |
* | --- |
* | "Copy a sample error report or try a full page refresh. The home link returns to the site homepage." |
*
* @param {Error_Preview_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const error_preview_description = /** @type {((inputs?: Error_Preview_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Error_Preview_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.error_preview_description(inputs)
	return __fr.error_preview_description(inputs)
});
/**
* | output |
* | --- |
* | "We couldn't load this example. Try refreshing the page, or copy the error details to share with support." |
*
* @param {Error_Preview_MessageInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const error_preview_message = /** @type {((inputs?: Error_Preview_MessageInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Error_Preview_MessageInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.error_preview_message(inputs)
	return __fr.error_preview_message(inputs)
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
* | "Build from source" |
*
* @param {Home_Repositories_EyebrowInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_repositories_eyebrow = /** @type {((inputs?: Home_Repositories_EyebrowInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Repositories_EyebrowInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_repositories_eyebrow(inputs)
	return __fr.home_repositories_eyebrow(inputs)
});
/**
* | output |
* | --- |
* | "Repositories" |
*
* @param {Home_Repositories_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_repositories_title = /** @type {((inputs?: Home_Repositories_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Repositories_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_repositories_title(inputs)
	return __fr.home_repositories_title(inputs)
});
/**
* | output |
* | --- |
* | "Start with a complete application, add production-ready authentication, or run a focused uptime monitor. Each repository is open source and ready to adapt." |
*
* @param {Home_Repositories_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_repositories_description = /** @type {((inputs?: Home_Repositories_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Repositories_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_repositories_description(inputs)
	return __fr.home_repositories_description(inputs)
});
/**
* | output |
* | --- |
* | "KrakStack Template" |
*
* @param {Home_Repository_Template_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_repository_template_title = /** @type {((inputs?: Home_Repository_Template_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Repository_Template_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_repository_template_title(inputs)
	return __fr.home_repository_template_title(inputs)
});
/**
* | output |
* | --- |
* | "A full-stack TanStack Start template with Effect services, Drizzle persistence, shadcn UI, and production-ready application patterns." |
*
* @param {Home_Repository_Template_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_repository_template_description = /** @type {((inputs?: Home_Repository_Template_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Repository_Template_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_repository_template_description(inputs)
	return __fr.home_repository_template_description(inputs)
});
/**
* | output |
* | --- |
* | "KrakStack Auth" |
*
* @param {Home_Repository_Auth_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_repository_auth_title = /** @type {((inputs?: Home_Repository_Auth_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Repository_Auth_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_repository_auth_title(inputs)
	return __fr.home_repository_auth_title(inputs)
});
/**
* | output |
* | --- |
* | "A reusable Better Auth implementation with organizations, sessions, API keys, and typed Effect integration." |
*
* @param {Home_Repository_Auth_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_repository_auth_description = /** @type {((inputs?: Home_Repository_Auth_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Repository_Auth_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_repository_auth_description(inputs)
	return __fr.home_repository_auth_description(inputs)
});
/**
* | output |
* | --- |
* | "KrakStack Uptime" |
*
* @param {Home_Repository_Uptime_TitleInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_repository_uptime_title = /** @type {((inputs?: Home_Repository_Uptime_TitleInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Repository_Uptime_TitleInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_repository_uptime_title(inputs)
	return __fr.home_repository_uptime_title(inputs)
});
/**
* | output |
* | --- |
* | "A lightweight status page and uptime monitor with health history, incident alerts, and a responsive public dashboard." |
*
* @param {Home_Repository_Uptime_DescriptionInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_repository_uptime_description = /** @type {((inputs?: Home_Repository_Uptime_DescriptionInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Repository_Uptime_DescriptionInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_repository_uptime_description(inputs)
	return __fr.home_repository_uptime_description(inputs)
});
/**
* | output |
* | --- |
* | "View repository" |
*
* @param {Home_Repository_ViewInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const home_repository_view = /** @type {((inputs?: Home_Repository_ViewInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Home_Repository_ViewInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.home_repository_view(inputs)
	return __fr.home_repository_view(inputs)
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