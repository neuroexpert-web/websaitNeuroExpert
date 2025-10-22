#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Fix AI Chat memory issue - context lost after 7 messages. Also verify all recent changes (new video, Yandex Metrika, WebP images, social buttons)"

backend:
  - task: "AI Chat API endpoint - Memory Fix"
    implemented: true
    working: "NA"
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: false
        agent: "user"
        comment: "User reported: AI Chat memory only lasts 7 messages, on 8th message it 'loops back' and starts over, forgetting previous context"
      - working: "NA"
        agent: "main"
        comment: "FIXED: Added MongoDB history loading to chat endpoint. Now loads last 20 messages from database and passes them as initial_messages to LlmChat. This ensures conversation context is preserved across multiple messages. Previously, LlmChat only kept messages in memory without database persistence, causing context loss after ~7 messages."

  - task: "Contact Form API endpoint"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 1
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Backend API already implemented, not modified in this iteration"
      - working: false
        agent: "testing"
        comment: "CRITICAL ISSUE: Contact Form API works partially - API endpoint returns correct response (200 OK, success: true) and saves data to MongoDB successfully. However, Telegram integration is BROKEN due to incorrect chat_id configuration. Backend uses bot token as chat_id which causes 401 Unauthorized errors. Telegram notifications are NOT being sent to users. This is a high-priority integration issue that needs immediate fix."
      - working: true
        agent: "testing"
        comment: "FINAL DEPLOYMENT CHECK PASSED: Contact Form API fully functional. API returns correct 200 OK responses with proper success messages. Data successfully saved to MongoDB (16 contact forms stored). Telegram integration WORKING - notifications sent successfully with '✅ Telegram notification sent successfully' in logs. Previous Telegram issue has been resolved. Ready for production deployment."

frontend:
  - task: "Video Background Component"
    implemented: true
    working: true
    file: "/app/frontend/src/components/VideoBackground.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Created new VideoBackground component with cosmic space video. Applied to ServiceCards, Portfolio, Advantages, Team, and ContactForm sections. Removed CSS cosmic animation from App.css"

  - task: "Mobile Responsive - Hero Section"
    implemented: true
    working: true
    file: "/app/frontend/src/components/Hero.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Optimized text sizes for mobile: reduced heading from 4xl to 3xl on mobile, adjusted button padding and spacing. Improved padding from py-20 to py-16 on mobile"

  - task: "Mobile Responsive - Portfolio Section"
    implemented: true
    working: true
    file: "/app/frontend/src/components/Portfolio.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Fixed padding issues on mobile. Adjusted from py-20 px-6 to py-12 sm:py-16 md:py-20 px-4 sm:px-6. Reduced image heights and text sizes for better mobile display"

  - task: "Mobile Responsive - ServiceCards Section"
    implemented: true
    working: true
    file: "/app/frontend/src/components/ServiceCards.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Applied responsive grid (1 col on mobile, 2 on sm, 4 on lg). Adjusted padding and spacing for mobile devices"

  - task: "Mobile Responsive - Advantages Section"
    implemented: true
    working: true
    file: "/app/frontend/src/components/Advantages.jsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Adjusted responsive grid and text sizes. Reduced padding for mobile displays"

  - task: "Mobile Responsive - Team Section"
    implemented: true
    working: true
    file: "/app/frontend/src/components/Team.jsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Optimized team cards for mobile. Adjusted text sizes and padding for better mobile experience"

  - task: "Mobile Responsive - Header"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/components/Header.jsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Header already had mobile menu implementation from previous iteration, not modified"

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: true

test_plan:
  current_focus:
    - "Video Background Component"
    - "Mobile Responsive - Hero Section"
    - "Mobile Responsive - Portfolio Section"
    - "Mobile Responsive - ServiceCards Section"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Completed video background integration and mobile responsive optimization. All sections except Hero now use the new cosmic space video background. Mobile adaptations include: optimized text sizes, improved padding/spacing, responsive grids. Ready for comprehensive testing on multiple device sizes (mobile 375px, tablet 768px, desktop 1920px). Please test video loading, responsiveness across devices, and interactive elements (service cards, team flips, AI chat)."
  - agent: "testing"
    message: "BACKEND TESTING COMPLETED: Contact Form API has CRITICAL Telegram integration issue. API endpoint works correctly (saves to MongoDB, returns proper responses) but Telegram notifications fail with 401 Unauthorized due to incorrect chat_id configuration. The code uses bot token as chat_id instead of actual chat ID. This prevents customer notifications from being sent. HIGH PRIORITY FIX NEEDED."
  - agent: "testing"
    message: "FINAL DEPLOYMENT CHECK COMPLETED: All backend systems READY FOR PRODUCTION. ✅ AI Chat API: Both claude-sonnet and gpt-4o models working perfectly, context preservation verified, database storage confirmed (66 messages). ✅ Contact Form API: Fully functional with successful MongoDB storage (16 forms) and working Telegram notifications. ✅ General Stability: Backend running correctly, MongoDB connected, EMERGENT_LLM_KEY operational, all endpoints responding without errors. Previous Telegram integration issue has been resolved. System is deployment-ready."
  - agent: "main"
    message: "USER FEEDBACK: AI Chat memory issue - context lost after 7 messages. FIXED by implementing MongoDB history loading. Now loads last 20 messages from database before each AI request to maintain conversation context. Also verified all recent changes: ✅ New video (ПОСЛЕДНЕЕ ВИДЕО .mp4) integrated ✅ Yandex Metrika working ✅ WebP images with lazy loading ✅ Social buttons (VK, Telegram) in header. Ready for testing to verify memory fix works correctly."
