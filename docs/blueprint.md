# **App Name**: DPR Insight

## Core Features:

- DPR Image Selection: Allow the user to select one of three provided DPR (Detailed Project Report) images for analysis.
- Evaluation Prompt Input: Provide a text input field for the user to enter evaluation criteria or instructions for the NVIDIA-hosted model.
- NVIDIA-Powered DPR Analysis: Utilize an NVIDIA foundation model to analyze the selected DPR image based on the user's prompt, mimicking the council's deliberation process (Creator, Critic, Worker, Justice). The AI will use web search and code interpreter tools as appropriate to come to a final recommendation.  The 'ask_user' tool must incorporate the user's input into the final deliberation.
- Risk Prediction: The application would distill its analysis to come up with a risk band using the same 'RED', 'AMBER', 'GREEN' codes as shown in the example.
- Result Display: Display the analysis results, including the deliberation trace, council verdict, risk band, confidence score, and governance action.

## Style Guidelines:

- Primary color: Dark green (#2E8B57) to represent growth and sustainability, aligning with the project report analysis theme.
- Background color: Very light grey (#F0F0F0), near white, to ensure readability and a clean, professional look.
- Accent color: A muted gold (#B8860B) to highlight key findings and recommendations, adding a touch of sophistication.
- Body font: 'Inter', a grotesque-style sans-serif font to be used throughout the application for body text.
- Headline font: 'Space Grotesk', a sans-serif font. If longer text is anticipated, 'Inter' will be used.
- Use simple, clear icons to represent different aspects of the analysis (e.g., risk levels, data sources, actions).
- Maintain a clean, organized layout with clear sections for image selection, prompt input, and result display.
- Use subtle transitions and animations to provide feedback to the user and guide them through the analysis process.