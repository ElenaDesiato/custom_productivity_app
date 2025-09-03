// This is a scaffold for AI meal calorie estimation.
// Replace the mock implementation with a real API call (e.g., OpenAI, Edamam, Spoonacular) as needed.

export async function estimateCaloriesFromDescription(description: string): Promise<{ calories: number, grams: number, caloriesPer100g: number, aiSource: string }> {
  // MOCK: Always returns 500 kcal, 300g, 167 kcal/100g
  // Replace this with a real API call
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        calories: 500,
        grams: 300,
        caloriesPer100g: 167,
        aiSource: 'mock',
      });
    }, 1000);
  });
}
