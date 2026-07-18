# Grey Analytics — Locked 180-Feature List

## ✅ Completed and Working Features

1. ✅ **Create an Account:** Users can register using their email address and password.

2. ✅ **Sign In:** Registered users can access their accounts using email and password.

4. ✅ **Sign Out:** Users can securely end their current session.

5. ✅ **Forgotten Password:** Users can request a password-reset email.

6. ✅ **Reset Password:** Users can choose a new password through the recovery link.

7. ✅ **Remember Signed-In Users:** Supabase preserves the user’s session between visits.

8. ✅ **Protect Private Pages:** Signed-out users are redirected away from dashboards, reports, uploads and settings.

9. ✅ **Return Users to Their Original Page:** Protected-route redirects preserve the requested path and the login flow returns the user to that validated destination.

10. ✅ **Display Account Information:** The Settings page shows the user’s name, email, business name, WhatsApp number and role.

11. ✅ **Update Account Information:** Name, business name and WhatsApp changes are saved to the signed-in user's Supabase profile.

12. ✅ **Save WhatsApp Number:** The WhatsApp number is persisted in the user's Supabase profile and restored after refresh.

13. ✅ **Notification Preferences:** Email and WhatsApp preferences are persisted and enforced by the notification endpoint before delivery.

14. ✅ **Delete Account:** Account deletion removes private stored originals first, then deletes the authentication account and cascaded user records.

15. ✅ **Completed Data-Deletion Process:** The deletion flow removes private originals and linked database records immediately; it stops with an explicit error if storage cleanup fails.

16. ✅ **Select Documents:** Users can select business files using a file picker.

17. ✅ **Drag and Drop Documents:** Users can drag files directly into the upload area.

18. ✅ **Upload Multiple Documents:** Several related financial documents can be processed together.

19. ✅ **Remove a Selected Document:** Users can remove a file before beginning extraction.

20. ✅ **Prevent Duplicate Selection:** The page prevents the same filename and file size from being added twice in one batch.

21. ✅ **Set a File Limit:** The upload page limits the number of files selected in one batch.

22. ✅ **Show Extraction Progress:** Users see processing steps and a progress bar while documents are being read.

23. ✅ **Retry Failed Extraction:** If document extraction fails, users can adjust the files and try again.

24. ✅ **Accept PDF Documents:** The application can extract text from supported PDF files.

25. ✅ **Accept CSV Files:** The application can read comma-separated financial exports.

26. ✅ **Accept Excel Files:** The application can read supported spreadsheet files.

27. ✅ **Accept Document Images:** Invoice photographs and other supported images can be sent for OCR.

28. ✅ **Limit Individual File Size:** The extraction endpoint enforces a maximum file size of approximately 20 MB.

29. ✅ **Verify Real File Types:** The server should inspect the actual file contents instead of trusting only the filename or supplied file type.

30. ✅ **Extract Text in the Browser:** Supported PDFs, CSV files and spreadsheets can be read locally where possible.

31. ✅ **Extract Text on the Server:** Files that require server processing can be sent to a protected extraction endpoint.

32. ✅ **Perform Image OCR:** AI vision can read text from supported images and scanned documents.

33. ✅ **Combine Extracted Documents:** Text from multiple uploaded files is combined into one analysis input.

34. ✅ **View Extracted Data:** Users can inspect the raw text collected from their documents.

35. ✅ **Protect the Extraction API:** A valid signed-in user token is required before the server processes a document.

36. ✅ **Stop Long Extraction Requests:** The extraction endpoint has a timeout to prevent requests from running indefinitely.

37. ✅ **Save Extracted Data:** Extracted text is persisted with the upload and durable audit record and is restored after refresh.

38. ✅ **Run Four Specialist Agents:** The application uses separate finance, operations, compliance and strategy agents.

39. ✅ **Run Agents in Parallel:** All four agents can analyse the extracted information at the same time.

40. ✅ **Show Agent Progress:** Users can see which agents are waiting, running, completed or failed.

41. ✅ **Show Partial Results:** Successful agent results remain visible even if another agent fails.

42. ✅ **Retry One Failed Agent:** Users do not need to restart the entire assessment when only one agent fails.

43. ✅ **Limit AI Input Size:** Large extracted documents are reduced before being sent to models with smaller token limits.

44. ✅ **Retry AI Rate-Limit Failures:** The analysis endpoint waits and retries when the provider rejects oversized or excessive requests.

45. ✅ **Stop Long AI Requests:** Each agent has a server-side timeout.

46. ✅ **Structure AI Results:** Agents return findings, evidence, severity, recommended fixes, insights and confidence levels.

47. ✅ **Protect the Analysis API:** Only authenticated users can request an analysis.

48. ✅ **Use Real Analysis in Every Environment:** Missing AI configuration and provider failures return explicit errors; mock analysis is never presented as a real result.

49. ✅ **Save Agent Results:** Each completed agent result is serialized through Supabase persistence so parallel agents cannot overwrite one another.

50. ✅ **Resume Interrupted Analysis:** Persisted extracted text, agent results and audit status survive refresh; completed agents are not rerun and failed or unfinished agents can retry.

51. ✅ **Detect Possible Financial Problems:** Agents can identify suspicious transactions, operational weaknesses, compliance concerns and strategic risks.

52. ✅ **Classify Finding Severity:** Findings can be marked as high, medium or low severity.

53. ✅ **Recommend Corrective Actions:** Each agent can suggest ways to investigate or correct a finding.

54. ✅ **Show Confidence Levels:** Agent results include a confidence value.

55. ✅ **Guarantee Findings Come From Uploaded Data:** Dashboard findings, savings and alerts are materialised from persisted, non-mocked agent results for the uploaded documents.

56. ✅ **Generate a Narrative Report:** The application can ask an AI model to create a structured five-page report.

57. ✅ **Display Audit Reports:** Users can view report summaries, findings, recommendations, charts and estimated savings.

58. ✅ **Save Report Records:** Reports can be stored in Supabase and loaded again after signing in.

59. ✅ **Protect the Report API:** A valid authenticated session is required to generate a report.

60. ✅ **Handle Report Timeouts:** Report generation stops after a defined period instead of hanging indefinitely.

61. ✅ **Remove Demonstration Findings From Production:** Production analysis and narrative endpoints reject missing configuration or failures instead of substituting demonstration results.

62. ✅ **Preserve the Supporting Evidence:** Original paths, extracted text, agent results and source references remain linked to the upload and audit records.

63. ✅ **Show a Main Dashboard:** Signed-in users receive a central view of their financial audits.

64. ✅ **Show Business Metrics:** Dashboard findings and savings are derived from the latest persisted analysis payload and totals.

65. ✅ **Show Recent Reports:** Persisted audit records and their real status and finding counts are loaded on the dashboard after refresh.

66. ✅ **Show a First-Time Empty State:** New users are prompted to upload their first document.

67. ✅ **Show Loading Placeholders:** The dashboard displays skeletons while account data is loading.

68. ✅ **Create In-App Alerts:** The application can show alerts for identified financial problems.

69. ✅ **View an Alerts Page:** Users can review detected problems in one place.

70. ✅ **Mark an Alert as Read:** Individual alerts can be marked as read and the change is saved.

71. ✅ **Prepare WhatsApp Messages:** The server contains a Twilio WhatsApp sending implementation.

72. ✅ **Prepare Email Messages:** The server contains a Resend email sending implementation.

73. ✅ **Protect the Alerts API:** Only authenticated users can trigger notifications.

74. ✅ **Trigger Notifications After Analysis:** The system attempts to send alerts once all four agents have finished.

75. ✅ **Use Real Findings for Every Alert:** Notifications are evaluated only from completed real agent results; the empty audit shell does not create alerts.

76. ✅ **Respect the Notification Switch:** The server loads saved email and WhatsApp preferences and suppresses opted-out channels before delivery.

78. ✅ **Mark All Alerts as Read:** Users should be able to clear the unread state in one action.

79. ✅ **Display Xero Integration:** Settings contain a connection option for Xero.

80. ✅ **Display QuickBooks Integration:** Settings contain a connection option for QuickBooks.

81. ✅ **Display Sage Integration:** Settings contain a connection option for Sage Business Cloud.

82. ✅ **Start an OAuth Connection:** The application contains the routes and client logic needed to begin connecting an accounting provider.

83. ✅ **Display Connection Status:** Settings can request stored accounting-connection information.

84. ✅ **Disconnect an Integration:** Users can request that a connected provider be disconnected.

85. ✅ **Separate User Data With RLS:** Supabase policies restrict users to their own uploads, reports, alerts and connections.

86. ✅ **Require Authentication for AI APIs:** Extraction, analysis, report and alert endpoints reject unauthenticated requests.

87. ✅ **Keep Provider Keys on the Server:** Groq, Twilio, Resend and other private credentials are not intentionally sent to the browser.

88. ✅ **Delete User-Owned Database Rows After Auth Deletion:** Foreign-key cascade rules remove associated rows when the authentication account is genuinely deleted.

89. ✅ **Apply Per-User Rate Limits:** Per-user server rate limits protect extraction, analysis, report and alert endpoints and record exceeded limits as security events.

90. ✅ **Privacy Policy:** The application contains a public privacy-policy page.

91. ✅ **Terms of Service:** The application contains a public terms page.

92. ✅ **Keep Private Routes Out of Search Engines:** Robots rules prevent dashboards, reports and APIs from being indexed.

93. ✅ **Record Acceptance of Terms:** Registration should save which version of the terms and privacy policy the user accepted.

94. ✅ **Responsive Interface:** Most screens adapt between desktop and mobile layouts.

95. ✅ **Mobile Navigation:** The private application includes mobile-friendly navigation.

96. ✅ **Consistent Design System:** Buttons, cards, forms, colours and dialogs follow a shared visual language.

97. ✅ **Loading States:** Important pages show visible activity while work is running.

98. ✅ **Error Messages:** Upload and agent failures are generally presented to the user.

99. ✅ **Installable PWA:** The application includes a web-app manifest, icons and an installation button.

100. ✅ **Deploy as a Cloudflare-Compatible Application:** The TanStack Start project is configured for a Cloudflare-style deployment target.

101. ✅ **Provide SEO Metadata:** Public pages include page titles and descriptions.

102. ✅ **Provide a Sitemap and Robots File:** Search engines receive public-route guidance.

103. ✅ **Usage and Cost Monitoring:** AI requests record per-user token estimates and approximate cost in persistent usage events.

34. ✅ **Enforce Account Upload Quotas:** Every extraction path passes through a server-enforced daily document allowance capped by the account plan; the browser cannot raise it.

35. ✅ **Save Original Documents:** Every accepted file is written to private original-document storage and its path is persisted on the matching upload.

36. ✅ **Link Findings to Exact Evidence:** Analysis prompts preserve document, page and sheet markers and findings display returned source references without inventing locations.

37. ✅ **Create Reports Only From Completed Analysis:** An empty durable audit shell may track progress, but narrative report generation is rejected until all four non-mocked analyses are complete.

38. ✅ **Handle Failed Database Saves:** Upload, audit and agent-result writes are awaited and database failures prevent the UI from reporting completion.

39. ✅ **Guarantee Accurate Dashboard Totals:** Report payloads and totals are updated from persisted agent results and reload correctly after refresh.

40. ✅ **Display Real WhatsApp Connection Status:** Settings shows only whether the account has enabled WhatsApp and explicitly distinguishes that from unverified Twilio deployment configuration.

41. ✅ **Prevent Duplicate Notifications Reliably:** A report is atomically claimed in Supabase before first delivery, preventing refreshes, tabs or concurrent requests from sending it twice.

45. ✅ **Substantiate Security Claims:** The privacy page now states the implemented private-storage and HTTPS controls and defers cipher, region and infrastructure claims to verified provider configuration.

46. ✅ **Securely Store Original Documents:** A private 20 MB Supabase bucket, server-only upload path, persisted linkage and account-deletion cleanup are defined.

47. ✅ **Match Legal Claims to Actual Behaviour:** Unverified AES, TLS-version, region and automatic 30-day deletion promises were removed and replaced with the implemented behavior.

17. ✅ **Prevent Duplicate Historical Uploads:** The server computes a SHA-256 content hash and rejects a document already stored for the same user.

20. ✅ **Reference Source Locations:** PDF page and spreadsheet sheet markers are retained in extracted text and can be returned and displayed on findings.

21. ✅ **Track an Audit as a Durable Job:** Audit status, extracted text and partial/completed agent state are persisted so refreshes can recover progress.

23. ✅ **Apply Account Usage Limits:** Server-side plan-capped document allowances and per-user AI endpoint rate limits are enforced.

24. ✅ **Track AI Costs:** Persistent usage events record estimated tokens and approximate model cost per user.

31. ✅ **Export Reports to PDF:** The completed inspection report exposes a print-to-PDF workflow with print-specific report layout.

32. ✅ **Export Reports to Word:** The completed inspection report can be generated and downloaded as a DOCX document.

35. ✅ **Add Report Disclaimers:** Generated, displayed and exported reports identify the output as AI-assisted review rather than a statutory audit.

36. ✅ **Show Report Methodology:** Reports list source documents, checks performed and limitations, and include that methodology in exports.

41. ✅ **Retry Failed Notifications Safely:** Retries are bounded to three attempts, target only the failed channel and retain the report's initial idempotency claim.

42. ✅ **Filter Alerts:** The alerts page filters by severity, read status, date and report/text reference.

43. ✅ **Unsubscribe From Email or WhatsApp:** Saved channel switches provide a clear opt-out and the server applies them before attempting delivery.

44. ✅ **Refresh Expired Provider Tokens:** The sync path calls expiry-aware token refresh, persists rotated refresh tokens and preserves provider organisation metadata; live provider sync remains separately unverified.

48. ✅ **Record Security Events:** Deletion requests, uploads, report generation, integration changes and synchronisation outcomes are written to the existing audit log.

49. ✅ **Monitor Suspicious Usage:** Exceeded per-user extraction, analysis, report and alert limits are recorded as suspicious-usage security events.

51. ✅ **Document AI Data Sharing:** The privacy page explains that extracted financial text may be sent to Groq for OCR, analysis, summarisation and narrative generation.

53. ✅ **Publish a Subprocessor List:** The privacy page identifies Supabase, Groq, Twilio, Resend and the conditional Cloudflare hosting role.

54. ✅ **Provide an AI-Audit Disclaimer:** The product and generated reports clearly distinguish AI-assisted anomaly review from a statutory audit.

55. ✅ **Global Unexpected-Error Page:** The application has a recoverable global unexpected-error page.

62. ✅ **Audit Failure Reference Number:** Core server failures generate a UUID reference stored with diagnostics and returned to the caller.

63. ✅ **Define Product Plans:** Free, pilot and paid account plan identifiers have explicit server-side daily document caps.

64. ✅ **Track Subscription Allowances:** The effective document allowance is calculated from the persisted plan and configured entitlement and measured server-side.

68. ✅ **Customer Onboarding:** The first-audit empty state explains supported formats, the three-step flow, the 20 MB limit and report limitations.

## ❌ Existing but Broken, Mocked or Incomplete Features

3. ❌ **Google Sign-In:** The Google sign-in control is enabled and uses the real OAuth flow, but the deployed Supabase/Lovable Google provider and redirect configuration have not been verified.

77. ❌ **Record Complete Delivery History:** Sent and failed attempts are stored with provider IDs, but provider delivery/bounce webhooks are not implemented, so the lifecycle is incomplete.

42. ❌ **Prove Complete Xero Synchronisation:** The connection and real financial-data import have not been verified end to end.

43. ❌ **Prove Complete QuickBooks Synchronisation:** The connection and real financial-data import have not been verified end to end.

44. ❌ **Prove Complete Sage Synchronisation:** The connection and real financial-data import have not been verified end to end.

48. ❌ **Complete Mobile Verification:** Analysis grids, report charts and very narrow screens have not been fully tested.

49. ❌ **Complete Accessibility Verification:** Keyboard use, screen-reader announcements, focus behaviour and reduced motion have not been comprehensively checked.

50. ❌ **Automated Testing:** No unit, integration or end-to-end test suite exists.

51. ❌ **Production Error Monitoring:** Server failures are persisted with traceable references in the audit log, but no deployed external monitoring service or alerting integration is verified.

34. ❌ **Version Reports:** A persistent version counter increments when narratives regenerate, but prior narrative bodies are overwritten rather than retained as historical versions.

50. ❌ **Define Data Retention:** Immediate account deletion is implemented and the policy states current behavior, but no automatic time-based purge job is configured.

## ❓ Non-Existent but Necessary Features

10. ❓ **Login Abuse Protection:** Repeated failed login attempts should be limited to prevent password attacks.

11. ❓ **Two-Factor Authentication:** Users should optionally protect their accounts with an additional verification step.

12. ❓ **Manage Active Sessions:** Users should be able to view and sign out devices currently using their account.

13. ❓ **Change Password While Signed In:** Account settings should provide a normal password-change option.

14. ❓ **Export Personal Data:** Users should be able to request a copy of the information Grey Analytics stores about them.

15. ❓ **Scan Files for Malware:** Documents should be checked before being accepted for processing.

16. ❓ **Show Per-File Results:** When uploading several documents, the interface should clearly show which individual files succeeded or failed.

18. ❓ **Download Extracted Data:** Users should be able to download the extracted text or structured records.

19. ❓ **Edit Extraction Errors:** Users should be able to correct obvious OCR mistakes before analysis begins.

22. ❓ **Cancel an Active Analysis:** Users should be able to stop an expensive or incorrectly started assessment.

25. ❓ **Queue Large Assessments:** Longer jobs should continue safely in the background without depending on an open browser tab.

26. ❓ **Accept or Reject Findings:** Users should be able to mark a finding as confirmed, dismissed or requiring investigation.

27. ❓ **Add Notes to Findings:** Users should be able to record explanations and investigation progress.

28. ❓ **Assign Findings:** A finding should optionally be assigned to a responsible staff member.

29. ❓ **Track Resolution:** Findings should move through states such as open, investigating, resolved and dismissed.

30. ❓ **Use Deterministic Financial Checks:** Duplicate payments, arithmetic errors and repeated invoice numbers should be checked using normal rules before relying on AI judgement.

33. ❓ **Generate a Findings Spreadsheet:** Users should be able to export findings and evidence to Excel or CSV.

37. ❓ **Search Reports:** Users should be able to find an audit by document, date or business name.

38. ❓ **Filter Report History:** Reports should be filterable by date, status, severity or source.

39. ❓ **Paginate Larger Histories:** Accounts with many reports should not load their entire history at once.

40. ❓ **Receive Delivery Webhooks:** Twilio and Resend should report delivered, bounced, failed or rejected messages back to Grey Analytics.

45. ❓ **Select an Accounting Organisation:** Users with several businesses should choose which organisation Grey Analytics may access.

46. ❓ **Schedule Automatic Synchronisation:** Connected accounting data should update on a controlled schedule.

47. ❓ **Show the Last Successful Sync:** Customers should see when data was last imported and whether anything failed.

52. ❓ **Verify Database Backups:** Production data should have tested backups and a restoration procedure.

56. ❓ **Offline Report Access:** An installed PWA should optionally allow previously downloaded reports to be viewed without connectivity.

57. ❓ **Automated Deployment Checks:** Every production deployment should build, test and run a basic smoke test automatically.

58. ❓ **Service Health Monitoring:** The deployed app, database and critical APIs should be checked continuously.

59. ❓ **Operational Alerts:** The team should be notified when extraction, AI, database or notification failure rates rise.

60. ❓ **Rollback Process:** A broken release should be reversible through a documented deployment procedure.

61. ❓ **Customer Support Channel:** Paying customers should have a clear way to report a failed audit or request help.

65. ❓ **Subscription Billing:** Payment collection is not currently implemented.

66. ❓ **Invoices and Receipts:** Paying businesses should receive billing documents.

67. ❓ **Trial Management:** Trial start, expiry and conversion should be handled automatically if self-service sales are planned.
