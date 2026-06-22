/**
 * Inbuilt marketing copywriting skill for poster generation.
 * Enhances user prompts with professional copywriting frameworks
 * before generating HTML output.
 */

export interface PosterCopyContext {
  /** User's original prompt */
  originalPrompt: string;
  /** Poster style/theme */
  style: string;
  /** Target audience (if provided) */
  audience?: string;
  /** Product/service being promoted */
  product?: string;
  /** Key benefit/outcome */
  benefit?: string;
  /** Call to action */
  cta?: string;
}

export interface EnhancedCopy {
  /** Enhanced headline */
  headline: string;
  /** Subheadline/tagline */
  subheadline: string;
  /** Key benefits (3-5) */
  benefits: string[];
  /** Call to action text */
  cta: string;
  /** Additional copy elements */
  elements: {
    problem?: string;
    solution?: string;
    proof?: string;
    urgency?: string;
  };
  /** Original context */
  context: PosterCopyContext;
}

// Headline and CTA formulas are used implicitly through pattern matching

/**
 * Extract key information from user prompt
 */
function extractContext(prompt: string): PosterCopyContext {
  const context: PosterCopyContext = {
    originalPrompt: prompt,
    style: "poster",
  };

  // Try to extract product/service
  const productPatterns = [
    /(?:promote|advertise|market|sell)\s+([^.!?,]+)/i,
    /(?:for|about)\s+([^.!?,]+)/i,
    /(?:product|service|app|tool):\s*([^.!?,]+)/i,
  ];

  for (const pattern of productPatterns) {
    const match = prompt.match(pattern);
    if (match && match[1]) {
      context.product = match[1].trim();
      break;
    }
  }

  // Try to extract audience
  const audiencePatterns = [
    /(?:targeting|for|audience):\s*([^.!?,]+)/i,
    /(?:helps|serves)\s+([^.!?,]+)/i,
  ];

  for (const pattern of audiencePatterns) {
    const match = prompt.match(pattern);
    if (match && match[1]) {
      context.audience = match[1].trim();
      break;
    }
  }

  // Try to extract benefit
  const benefitPatterns = [
    /(?:benefit|outcome|result):\s*([^.!?,]+)/i,
    /(?:helps you|lets you|enables you)\s+([^.!?,]+)/i,
    /(?:to|so you can)\s+([^.!?,]+)/i,
  ];

  for (const pattern of benefitPatterns) {
    const match = prompt.match(pattern);
    if (match && match[1]) {
      context.benefit = match[1].trim();
      break;
    }
  }

  return context;
}

/**
 * Generate headline using formulas
 */
function generateHeadline(context: PosterCopyContext): string {
  // If we have specific context, use targeted formulas
  if (context.benefit && context.product) {
    return `${context.benefit} with ${context.product}`;
  }

  if (context.audience && context.product) {
    return `The ${context.product} for ${context.audience}`;
  }

  if (context.benefit) {
    // Extract outcome and pain from benefit
    const benefitMatch = context.benefit.match(/(.+?)\s+(?:without|in|by)\s+(.+)/i);
    if (benefitMatch && benefitMatch[1] && benefitMatch[2]) {
      return `${benefitMatch[1]} without ${benefitMatch[2]}`;
    }
    return context.benefit;
  }

  // Default: use original prompt as headline
  return context.originalPrompt.slice(0, 60);
}

/**
 * Generate subheadline expanding on headline
 */
function generateSubheadline(context: PosterCopyContext): string {
  if (context.benefit && context.audience) {
    return `Designed for ${context.audience} who want ${context.benefit}`;
  }

  if (context.product && context.benefit) {
    return `${context.product} helps you ${context.benefit}`;
  }

  // Default: generic expansion
  return "Simple, fast, and effective";
}

/**
 * Generate key benefits (3-5)
 */
function generateBenefits(context: PosterCopyContext): string[] {
  const benefits: string[] = [];

  // If user provided specific benefit
  if (context.benefit) {
    benefits.push(context.benefit);
  }

  // Add generic benefits if needed
  const genericBenefits = [
    "Save time and effort",
    "Get results faster",
    "Easy to use",
    "No experience needed",
    "Works immediately",
  ];

  // Fill up to 3-5 benefits
  while (benefits.length < 3) {
    const nextBenefit = genericBenefits[benefits.length]!;
    if (!benefits.includes(nextBenefit)) {
      benefits.push(nextBenefit);
    }
  }

  return benefits.slice(0, 5);
}

/**
 * Generate CTA text
 */
function generateCTA(context: PosterCopyContext): string {
  if (context.product) {
    return `Try ${context.product}`;
  }

  if (context.benefit) {
    return `Get ${context.benefit}`;
  }

  return "Learn More";
}

/**
 * Main function: enhance user prompt with marketing copywriting
 */
export function enhancePosterCopy(prompt: string): EnhancedCopy {
  // Step 1: Extract context from user prompt
  const context = extractContext(prompt);

  // Step 2: Generate enhanced copy elements
  const headline = generateHeadline(context);
  const subheadline = generateSubheadline(context);
  const benefits = generateBenefits(context);
  const cta = generateCTA(context);

  // Step 3: Build enhanced copy structure
  return {
    headline,
    subheadline,
    benefits,
    cta,
    elements: {
      problem: context.benefit ? `Struggling to ${context.benefit}?` : undefined,
      solution: context.product ? `${context.product} is the answer.` : undefined,
      proof: "Join thousands of satisfied users",
      urgency: "Limited time offer",
    },
    context,
  };
}

/**
 * Generate enhanced prompt for the LLM
 */
export function buildEnhancedPrompt(
  originalPrompt: string,
  enhancedCopy: EnhancedCopy,
): string {
  return `
ORIGINAL USER REQUEST:
${originalPrompt}

ENHANCED MARKETING COPY (use these elements in the poster design):

HEADLINE (primary message, above the fold):
${enhancedCopy.headline}

SUBHEADLINE (expands on headline, adds specificity):
${enhancedCopy.subheadline}

KEY BENEFITS (3-5 bullet points, use as feature highlights):
${enhancedCopy.benefits.map((b, i) => `${i + 1}. ${b}`).join("\n")}

CALL TO ACTION (button text, action-oriented):
${enhancedCopy.cta}

OPTIONAL ELEMENTS:
- Problem statement: ${enhancedCopy.elements.problem ?? "Not specified"}
- Solution: ${enhancedCopy.elements.solution ?? "Not specified"}
- Proof point: ${enhancedCopy.elements.proof ?? "Not specified"}
- Urgency: ${enhancedCopy.elements.urgency ?? "Not specified"}

COPYWRITING GUIDELINES:
1. Place headline prominently at the top (hero section)
2. Use subheadline directly below headline
3. Benefits should be clear, specific, and outcome-focused
4. CTA should be action-oriented: "Get X" not "Sign Up"
5. Use customer language, avoid jargon
6. Be specific over vague (include numbers, timeframes)
7. Show benefits, not just features

DESIGN INSTRUCTIONS:
Create a visually striking poster that incorporates the enhanced marketing copy above.
The headline should be the most prominent element.
Use the benefits as key selling points.
Make the CTA clear and compelling.
Apply the style and aesthetic from the original request.
`;
}