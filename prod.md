# Grey Analytics — Locked 180-Feature List

## ✅ Completed and Working Features

1. ✅ **Create an Account:** Users can register using their email address and password.

2. ✅ **Sign In:** Registered users can access their accounts using email and password.

3. ✅ **Google Sign-In:** Users can authenticate through their Google account.

4. ✅ **Sign Out:** Users can securely end their current session.

5. ✅ **Forgotten Password:** Users can request a password-reset email.

6. ✅ **Reset Password:** Users can choose a new password through the recovery link.

7. ✅ **Remember Signed-In Users:** Supabase preserves the user’s session between visits.

8. ✅ **Protect Private Pages:** Signed-out users are redirected away from dashboards, reports, uploads and settings.

9. ✅ **Return Users to Their Original Page:** After signing in, users should return to the page they originally attempted to open.

10. ✅ **Display Account Information:** The Settings page shows the user’s name, email, business name, WhatsApp number and role.

11. ✅ **Update Account Information:** The form says “Account updated,” but the changes are not saved to the database.

12. ✅ **Save WhatsApp Number:** Users can enter a WhatsApp number, but the edited number is not permanently saved.

13. ✅ **Notification Preferences:** A notification switch exists, but its setting is not saved or respected when alerts are triggered.

14. ✅ **Delete Account:** The button claims to delete the account but currently only logs the user out.

15. ✅ **Completed Data-Deletion Process:** Account deletion should remove or schedule the removal of documents, reports, alerts and personal information.

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

37. ✅ **Save Extracted Data:** Extracted text is kept in browser memory and disappears after a refresh or new session.

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

48. ✅ **Use Real Analysis in Every Environment:** When AI keys are missing, the system can silently return demonstration results.

49. ✅ **Save Agent Results:** Completed analyses are stored only in browser memory and disappear after refresh.

50. ✅ **Resume Interrupted Analysis:** Closing or refreshing the page can destroy current analysis progress.

51. ✅ **Detect Possible Financial Problems:** Agents can identify suspicious transactions, operational weaknesses, compliance concerns and strategic risks.

52. ✅ **Classify Finding Severity:** Findings can be marked as high, medium or low severity.

53. ✅ **Recommend Corrective Actions:** Each agent can suggest ways to investigate or correct a finding.

54. ✅ **Show Confidence Levels:** Agent results include a confidence value.

55. ✅ **Guarantee Findings Come From Uploaded Data:** Some visible reports, charts, savings and alerts are initially created from mock report data.

56. ✅ **Generate a Narrative Report:** The application can ask an AI model to create a structured five-page report.

57. ✅ **Display Audit Reports:** Users can view report summaries, findings, recommendations, charts and estimated savings.

58. ✅ **Save Report Records:** Reports can be stored in Supabase and loaded again after signing in.

59. ✅ **Protect the Report API:** A valid authenticated session is required to generate a report.

60. ✅ **Handle Report Timeouts:** Report generation stops after a defined period instead of hanging indefinitely.

61. ✅ **Remove Demonstration Findings From Production:** Mock charts, leaks and narrative content can still appear as if they were real audit results.

62. ✅ **Preserve the Supporting Evidence:** A saved report can survive while its extracted text and agent results are lost.

63. ✅ **Show a Main Dashboard:** Signed-in users receive a central view of their financial audits.

64. ✅ **Show Business Metrics:** The dashboard displays findings, savings estimates and report information.

65. ✅ **Show Recent Reports:** Previously saved reports can appear on the dashboard.

66. ✅ **Show a First-Time Empty State:** New users are prompted to upload their first document.

67. ✅ **Show Loading Placeholders:** The dashboard displays skeletons while account data is loading.

68. ✅ **Create In-App Alerts:** The application can show alerts for identified financial problems.

69. ✅ **View an Alerts Page:** Users can review detected problems in one place.

70. ✅ **Mark an Alert as Read:** Individual alerts can be marked as read and the change is saved.

71. ✅ **Prepare WhatsApp Messages:** The server contains a Twilio WhatsApp sending implementation.

72. ✅ **Prepare Email Messages:** The server contains a Resend email sending implementation.

73. ✅ **Protect the Alerts API:** Only authenticated users can trigger notifications.

74. ✅ **Trigger Notifications After Analysis:** The system attempts to send alerts once all four agents have finished.

75. ✅ **Use Real Findings for Every Alert:** Alerts are also created from the initial mock report before real analysis is complete.

76. ✅ **Respect the Notification Switch:** Turning WhatsApp alerts off does not reliably prevent delivery.

77. ✅ **Record Complete Delivery History:** An `alert_deliveries` table exists, but the complete provider-delivery lifecycle is not connected.

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

89. ✅ **Apply Per-User Rate Limits:** Authentication exists, but a signed-in user can repeatedly consume OCR and AI resources.

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

103. ✅ **Usage and Cost Monitoring:** AI requests and expenses are not tracked per account.

## ❌ Existing but Broken, Mocked or Incomplete Features

34. ❌ **Enforce Account Upload Quotas:** The visible limit is primarily controlled in the browser and is not a secure monthly or subscription-based server quota.

35. ❌ **Save Original Documents:** Uploaded files are processed, but the originals are not permanently stored and connected to their reports.

36. ❌ **Link Findings to Exact Evidence:** Findings contain evidence text, but they are not reliably connected to a source document, page, row or transaction.

37. ❌ **Create Reports Only From Completed Analysis:** A mock report is created before the real four-agent assessment finishes.

38. ❌ **Handle Failed Database Saves:** The interface can report success without checking whether Supabase actually saved the report.

39. ❌ **Guarantee Accurate Dashboard Totals:** Dashboard figures can be derived from mock reports rather than verified findings.

40. ❌ **Display Real WhatsApp Connection Status:** Settings always show WhatsApp Business as connected.

41. ❌ **Prevent Duplicate Notifications Reliably:** Browser memory prevents some repeated sends, but refreshing can allow the same report to trigger again.

42. ❌ **Prove Complete Xero Synchronisation:** The connection and real financial-data import have not been verified end to end.

43. ❌ **Prove Complete QuickBooks Synchronisation:** The connection and real financial-data import have not been verified end to end.

44. ❌ **Prove Complete Sage Synchronisation:** The connection and real financial-data import have not been verified end to end.

45. ❌ **Substantiate Security Claims:** The interface promises AES-256 at rest, TLS 1.3 and 30-day deletion without demonstrating the complete process in the application.

46. ❌ **Securely Store Original Documents:** Original uploads are not managed through a clear private-storage and retention system.

47. ❌ **Match Legal Claims to Actual Behaviour:** Some privacy, deletion and security promises currently exceed what the code performs.

48. ❌ **Complete Mobile Verification:** Analysis grids, report charts and very narrow screens have not been fully tested.

49. ❌ **Complete Accessibility Verification:** Keyboard use, screen-reader announcements, focus behaviour and reduced motion have not been comprehensively checked.

50. ❌ **Automated Testing:** No unit, integration or end-to-end test suite exists.

51. ❌ **Production Error Monitoring:** There is no demonstrated monitoring service collecting browser and server failures.

## ❓ Non-Existent but Necessary Features

10. ❓ **Login Abuse Protection:** Repeated failed login attempts should be limited to prevent password attacks.

11. ❓ **Two-Factor Authentication:** Users should optionally protect their accounts with an additional verification step.

12. ❓ **Manage Active Sessions:** Users should be able to view and sign out devices currently using their account.

13. ❓ **Change Password While Signed In:** Account settings should provide a normal password-change option.

14. ❓ **Export Personal Data:** Users should be able to request a copy of the information Grey Analytics stores about them.

15. ❓ **Scan Files for Malware:** Documents should be checked before being accepted for processing.

16. ❓ **Show Per-File Results:** When uploading several documents, the interface should clearly show which individual files succeeded or failed.

17. ❓ **Prevent Duplicate Historical Uploads:** The system should recognise when the same document was uploaded in an earlier session.

18. ❓ **Download Extracted Data:** Users should be able to download the extracted text or structured records.

19. ❓ **Edit Extraction Errors:** Users should be able to correct obvious OCR mistakes before analysis begins.

20. ❓ **Reference Source Locations:** Extracted records should retain their original document, page, sheet and row locations.

21. ❓ **Track an Audit as a Durable Job:** Every audit should have a permanent status such as extracting, analysing, partially complete, complete or failed.

22. ❓ **Cancel an Active Analysis:** Users should be able to stop an expensive or incorrectly started assessment.

23. ❓ **Apply Account Usage Limits:** Users should have controlled document, page, token or audit allowances.

24. ❓ **Track AI Costs:** The system should record approximate model usage and cost for each user and audit.

25. ❓ **Queue Large Assessments:** Longer jobs should continue safely in the background without depending on an open browser tab.

26. ❓ **Accept or Reject Findings:** Users should be able to mark a finding as confirmed, dismissed or requiring investigation.

27. ❓ **Add Notes to Findings:** Users should be able to record explanations and investigation progress.

28. ❓ **Assign Findings:** A finding should optionally be assigned to a responsible staff member.

29. ❓ **Track Resolution:** Findings should move through states such as open, investigating, resolved and dismissed.

30. ❓ **Use Deterministic Financial Checks:** Duplicate payments, arithmetic errors and repeated invoice numbers should be checked using normal rules before relying on AI judgement.

31. ❓ **Export Reports to PDF:** Users should be able to download a professionally formatted PDF report.

32. ❓ **Export Reports to Word:** The project includes document-generation support, but users do not yet have a completed Word export workflow.

33. ❓ **Generate a Findings Spreadsheet:** Users should be able to export findings and evidence to Excel or CSV.

34. ❓ **Version Reports:** Regenerating a report should create a traceable new version instead of silently replacing history.

35. ❓ **Add Report Disclaimers:** Reports should explain that Grey Analytics provides AI-assisted review and not a statutory independent audit.

36. ❓ **Show Report Methodology:** Customers should be told which checks were performed, which documents were used and which checks could not be completed.

37. ❓ **Search Reports:** Users should be able to find an audit by document, date or business name.

38. ❓ **Filter Report History:** Reports should be filterable by date, status, severity or source.

39. ❓ **Paginate Larger Histories:** Accounts with many reports should not load their entire history at once.

40. ❓ **Receive Delivery Webhooks:** Twilio and Resend should report delivered, bounced, failed or rejected messages back to Grey Analytics.

41. ❓ **Retry Failed Notifications Safely:** Failed alerts should retry without sending duplicates.

42. ❓ **Filter Alerts:** Users should filter alerts by severity, date, status and report.

43. ❓ **Unsubscribe From Email or WhatsApp:** Customers should have a clear opt-out process.

44. ❓ **Refresh Expired Provider Tokens:** Connections should remain active safely when access tokens expire.

45. ❓ **Select an Accounting Organisation:** Users with several businesses should choose which organisation Grey Analytics may access.

46. ❓ **Schedule Automatic Synchronisation:** Connected accounting data should update on a controlled schedule.

47. ❓ **Show the Last Successful Sync:** Customers should see when data was last imported and whether anything failed.

48. ❓ **Record Security Events:** Important actions such as login, deletion, connection changes and report generation should be logged.

49. ❓ **Monitor Suspicious Usage:** Excessive uploads, repeated AI requests and unusual access patterns should be detected.

50. ❓ **Define Data Retention:** Original files, extracted text, reports and logs need explicit retention periods and automatic deletion.

51. ❓ **Document AI Data Sharing:** Customers should know which external AI services receive their financial data.

52. ❓ **Verify Database Backups:** Production data should have tested backups and a restoration procedure.

53. ❓ **Publish a Subprocessor List:** Customers should know which cloud, AI, email and messaging providers process their information.

54. ❓ **Provide an AI-Audit Disclaimer:** The product should clearly distinguish financial anomaly detection from regulated statutory auditing.

55. ❓ **Global Unexpected-Error Page:** The application should give users a recoverable page when an unforeseen interface error occurs.

56. ❓ **Offline Report Access:** An installed PWA should optionally allow previously downloaded reports to be viewed without connectivity.

57. ❓ **Automated Deployment Checks:** Every production deployment should build, test and run a basic smoke test automatically.

58. ❓ **Service Health Monitoring:** The deployed app, database and critical APIs should be checked continuously.

59. ❓ **Operational Alerts:** The team should be notified when extraction, AI, database or notification failure rates rise.

60. ❓ **Rollback Process:** A broken release should be reversible through a documented deployment procedure.

61. ❓ **Customer Support Channel:** Paying customers should have a clear way to report a failed audit or request help.

62. ❓ **Audit Failure Reference Number:** Each failed operation should provide an identifier that support can trace.

63. ❓ **Define Product Plans:** The application needs clear limits for trials, pilots and paid customers.

64. ❓ **Track Subscription Allowances:** Document, page, audit or AI usage should be measured against the customer’s plan.

65. ❓ **Subscription Billing:** Payment collection is not currently implemented.

66. ❓ **Invoices and Receipts:** Paying businesses should receive billing documents.

67. ❓ **Trial Management:** Trial start, expiry and conversion should be handled automatically if self-service sales are planned.

68. ❓ **Customer Onboarding:** New users should receive a short explanation of supported files, report limitations and the first-audit process.
