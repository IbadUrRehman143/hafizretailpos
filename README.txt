Hafiz Retail POS - Floating AI Agent

1. Copy app/components/ai/floatingAiAgent.tsx into the project.
2. Copy public/ai-agent-robot.png into the project.
3. In app/components/layout/dashboardLayout.tsx add:

import FloatingAiAgent from "../ai/floatingAiAgent";

Then render this immediately before the <style jsx global> block:

<FloatingAiAgent />

This version is visual-only. It intentionally does not open chat yet. Phase 4 can attach the chat panel to the same component.
