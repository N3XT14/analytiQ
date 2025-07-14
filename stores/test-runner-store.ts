import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface TestRequest {
  id: string
  name: string
  body: string
  expectedStatus: number
  expectedResponse: string
  timeout: number
}

export interface TestCase {
  id: string
  name: string
  description: string
  type: "individual" | "batch"
  endpoint: string
  method: "GET" | "POST" | "PUT" | "DELETE"
  headers: Record<string, string>
  requests: TestRequest[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface TestResult {
  id: string
  testCaseId: string
  requestId: string
  status: "running" | "passed" | "failed" | "timeout"
  actualStatus?: number
  actualResponse?: string
  duration?: number
  error?: string
  timestamp: string
}

interface TestRunnerState {
  // Test Cases
  testCases: TestCase[]
  addTestCase: (testCase: Omit<TestCase, "id" | "createdAt" | "updatedAt">) => void
  updateTestCase: (id: string, updates: Partial<TestCase>) => void
  deleteTestCase: (id: string) => void
  duplicateTestCase: (id: string) => void
  getTestCase: (id: string) => TestCase | undefined

  // Test Results
  testResults: TestResult[]
  addTestResult: (result: TestResult) => void
  updateTestResult: (id: string, updates: Partial<TestResult>) => void
  getTestCaseResults: (testCaseId: string) => TestResult[]
  clearResults: () => void

  // Running State
  isRunning: boolean
  runningTestCaseId: string | null
  runProgress: number
  setRunning: (running: boolean, testCaseId?: string) => void
  setRunProgress: (progress: number) => void

  // Import/Export
  importTestCases: (testCases: TestCase[]) => void
  exportTestCase: (id: string) => TestCase | null

  // Filters and Search
  searchTerm: string
  selectedTags: string[]
  selectedType: "all" | "individual" | "batch"
  setSearchTerm: (term: string) => void
  setSelectedTags: (tags: string[]) => void
  setSelectedType: (type: "all" | "individual" | "batch") => void
  getFilteredTestCases: () => TestCase[]

  // Statistics
  getStats: () => {
    totalTests: number
    individualTests: number
    batchTests: number
    totalRequests: number
    recentResults: {
      passed: number
      failed: number
      timeout: number
    }
  }
}

export const useTestRunnerStore = create<TestRunnerState>()(
  persist(
    (set, get) => ({
      // Initial state
      testCases: [
        {
          id: "1",
          name: "GPT-4 Text Generation",
          description: "Test GPT-4 API for text generation",
          type: "individual",
          endpoint: "https://api.openai.com/v1/chat/completions",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer YOUR_API_KEY",
          },
          requests: [
            {
              id: "req-1",
              name: "Generate Text",
              body: JSON.stringify(
                {
                  model: "gpt-4",
                  messages: [{ role: "user", content: "Explain quantum computing in simple terms" }],
                  max_tokens: 500,
                },
                null,
                2,
              ),
              expectedStatus: 200,
              expectedResponse: "quantum",
              timeout: 30000,
            },
          ],
          tags: ["ai", "gpt-4"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "AI Model Comparison Suite",
          description: "Compare responses from multiple AI models with different prompts",
          type: "batch",
          endpoint: "https://api.openai.com/v1/chat/completions",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer YOUR_API_KEY",
          },
          requests: [
            {
              id: "req-2",
              name: "Poetry Request",
              body: JSON.stringify(
                {
                  model: "gpt-4",
                  messages: [{ role: "user", content: "Write a short poem about AI" }],
                  max_tokens: 200,
                },
                null,
                2,
              ),
              expectedStatus: 200,
              expectedResponse: "poem",
              timeout: 30000,
            },
            {
              id: "req-3",
              name: "Technical Explanation",
              body: JSON.stringify(
                {
                  model: "gpt-4",
                  messages: [{ role: "user", content: "Explain machine learning in simple terms" }],
                  max_tokens: 300,
                },
                null,
                2,
              ),
              expectedStatus: 200,
              expectedResponse: "learning",
              timeout: 30000,
            },
          ],
          tags: ["ai", "comparison", "batch"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      testResults: [],
      isRunning: false,
      runningTestCaseId: null,
      runProgress: 0,
      searchTerm: "",
      selectedTags: [],
      selectedType: "all",

      // Test Case Actions
      addTestCase: (testCase) => {
        const newTestCase: TestCase = {
          ...testCase,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({
          testCases: [...state.testCases, newTestCase],
        }))
      },

      updateTestCase: (id, updates) => {
        set((state) => ({
          testCases: state.testCases.map((tc) =>
            tc.id === id ? { ...tc, ...updates, updatedAt: new Date().toISOString() } : tc,
          ),
        }))
      },

      deleteTestCase: (id) => {
        set((state) => ({
          testCases: state.testCases.filter((tc) => tc.id !== id),
          testResults: state.testResults.filter((tr) => tr.testCaseId !== id),
        }))
      },

      duplicateTestCase: (id) => {
        const testCase = get().testCases.find((tc) => tc.id === id)
        if (testCase) {
          const duplicated: TestCase = {
            ...testCase,
            id: Date.now().toString(),
            name: `${testCase.name} (Copy)`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          set((state) => ({
            testCases: [...state.testCases, duplicated],
          }))
        }
      },

      getTestCase: (id) => {
        return get().testCases.find((tc) => tc.id === id)
      },

      // Test Result Actions
      addTestResult: (result) => {
        set((state) => ({
          testResults: [result, ...state.testResults],
        }))
      },

      updateTestResult: (id, updates) => {
        set((state) => ({
          testResults: state.testResults.map((tr) => (tr.id === id ? { ...tr, ...updates } : tr)),
        }))
      },

      getTestCaseResults: (testCaseId) => {
        return get().testResults.filter((tr) => tr.testCaseId === testCaseId)
      },

      clearResults: () => {
        set({ testResults: [] })
      },

      // Running State Actions
      setRunning: (running, testCaseId) => {
        set({
          isRunning: running,
          runningTestCaseId: running ? testCaseId || null : null,
          runProgress: running ? 0 : 0,
        })
      },

      setRunProgress: (progress) => {
        set({ runProgress: progress })
      },

      // Import/Export Actions
      importTestCases: (testCases) => {
        const importedTestCases = testCases.map((tc) => ({
          ...tc,
          id: `imported-${Date.now()}-${Math.random()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
        set((state) => ({
          testCases: [...state.testCases, ...importedTestCases],
        }))
      },

      exportTestCase: (id) => {
        return get().testCases.find((tc) => tc.id === id) || null
      },

      // Filter Actions
      setSearchTerm: (term) => {
        set({ searchTerm: term })
      },

      setSelectedTags: (tags) => {
        set({ selectedTags: tags })
      },

      setSelectedType: (type) => {
        set({ selectedType: type })
      },

      getFilteredTestCases: () => {
        const { testCases, searchTerm, selectedTags, selectedType } = get()

        return testCases.filter((tc) => {
          // Search term filter
          const matchesSearch =
            !searchTerm ||
            tc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tc.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

          // Type filter
          const matchesType = selectedType === "all" || tc.type === selectedType

          // Tags filter
          const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => tc.tags.includes(tag))

          return matchesSearch && matchesType && matchesTags
        })
      },

      // Statistics
      getStats: () => {
        const { testCases, testResults } = get()
        const recentResults = testResults.slice(0, 100) // Last 100 results

        return {
          totalTests: testCases.length,
          individualTests: testCases.filter((tc) => tc.type === "individual").length,
          batchTests: testCases.filter((tc) => tc.type === "batch").length,
          totalRequests: testCases.reduce((sum, tc) => sum + tc.requests.length, 0),
          recentResults: {
            passed: recentResults.filter((r) => r.status === "passed").length,
            failed: recentResults.filter((r) => r.status === "failed").length,
            timeout: recentResults.filter((r) => r.status === "timeout").length,
          },
        }
      },
    }),
    {
      name: "test-runner-storage",
      partialize: (state) => ({
        testCases: state.testCases,
        testResults: state.testResults,
      }),
    },
  ),
)
