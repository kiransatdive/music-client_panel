const fs = require('fs');

let content = fs.readFileSync('src/pages/CreateRelease.tsx', 'utf8');

// Replace Steps definition
const newSteps = `  // Stepper steps configuration
  const stepsConfig = [
    { id: 'details', name: 'Release Details', desc: 'Title, Genre & Basic Metadata', icon: FileText },
    { id: 'tracks', name: 'Upload Tracks', desc: 'WAV Audio Files', icon: Music },
    { id: 'artwork', name: 'Upload Artwork', desc: 'Square JPG/PNG image', icon: Upload },
    ...(!id ? [{ id: 'whitelist', name: 'Whitelist Domain', desc: 'Submit Domain for Whitelist', icon: Link }] : []),
    { id: 'platforms', name: 'Select Platforms', desc: 'Distribution Platforms', icon: Globe },
    { id: 'review', name: 'Review & Submit', desc: 'Final Verification', icon: CheckCircle },
  ];

  const steps = stepsConfig.map((s, index) => ({
    ...s,
    number: index + 1,
    active: currentStep === index + 1
  }));

  const activeStepId = steps[currentStep - 1]?.id || 'details';`;

content = content.replace(
/  \/\/ Stepper steps configuration[\s\S]*?  \];/g,
  newSteps
);

// Replace conditionals for rendering steps
content = content.replace(/\{currentStep === 1 && \(/g, "{activeStepId === 'details' && (");
content = content.replace(/\{currentStep === 2 && \(/g, "{activeStepId === 'tracks' && (");
content = content.replace(/\{currentStep === 3 && \(/g, "{activeStepId === 'artwork' && (");
content = content.replace(/\{currentStep === 4 && \(/g, "{activeStepId === 'whitelist' && (");
content = content.replace(/\{currentStep === 5 && \(/g, "{activeStepId === 'platforms' && (");
content = content.replace(/\{currentStep === 6 && \(/g, "{activeStepId === 'review' && (");

// Change Step header count
content = content.replace(/Step \{currentStep\} of 6/g, "Step {currentStep} of {steps.length}");
// Change progress bar max
content = content.replace(/style=\{\{ width: \`\$\{ \(currentStep \/ 6\) \* 100 \}\%\` \}\}/g, "style={{ width: `${ (currentStep / steps.length) * 100 }%` }}");

// Replace onClick={() => setCurrentStep(X)} for Back Buttons with setCurrentStep(currentStep - 1)
content = content.replace(/onClick=\{\(\) => setCurrentStep\(\d+\)\}\s*className="px-6 py-2\.5 rounded-xl font-bold text-sm text-slate-500 hover:text-slate-700/g, 'onClick={() => setCurrentStep(currentStep - 1)}\n                    className="px-6 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:text-slate-700');

// Replace next step assignments inside handler functions
// onSubmit
content = content.replace(/setCurrentStep\(2\);/g, "setCurrentStep(currentStep + 1);");
// handleSaveAndNextTracks
content = content.replace(/setCurrentStep\(3\);/g, "setCurrentStep(currentStep + 1);");
// handleSaveAndNextArtwork
content = content.replace(/setCurrentStep\(4\);/g, "setCurrentStep(currentStep + 1);");
// handleSaveAndNextWhitelist
content = content.replace(/setCurrentStep\(5\);/g, "setCurrentStep(currentStep + 1);");
// handleSaveAndNextPlatforms
content = content.replace(/setCurrentStep\(6\);/g, "setCurrentStep(currentStep + 1);");

// Fix stepper header clicks (st.number < 6)
content = content.replace(/st.number < 6/g, "st.number < steps.length");

fs.writeFileSync('src/pages/CreateRelease.tsx', content, 'utf8');
console.log("Patched successfully");
