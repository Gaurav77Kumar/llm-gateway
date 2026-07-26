## AI Tools/Models I Used

I mostly used ChatGPT and DeepSeek throughout this assignment. I used them primarily to understand concepts that were new to me, explore different approaches before making implementation decisions, review my code for potential issues, help debug errors, and improve the documentation.

When I received a suggestion, especially for important parts such as authentication, budget enforcement, provider calls, and fallback logic, I tried to understand why the code worked before including it in the project.



## One Place Where AI Was Wrong or Misleading

I encountered a couple of cases where AI suggestions were incorrect or misleading.

One example happened while configuring Gemini as the fallback provider. AI suggested a Gemini model for testing, but when I actually called the API, the model was not available for my account. I caught this by inspecting the real error response from the Gemini API rather than assuming the suggested model name was correct. I then changed the model based on the provider's response and tested the fallback again.

Another example occurred in the budget enforcement logic. Initially, when MongoDB's `findOneAndUpdate()` returned `null`, it was interpreted as meaning that the `VirtualKey` did not exist. After inspecting the MongoDB usage logs and the atomic query more carefully, I realized that `null` could also mean that the `$expr` budget condition did not match because the new token usage would exceed the remaining budget.

I fixed this by separately checking whether the key existed. If the key exists but the atomic update fails, the gateway now treats it as a budget-exceeded condition and returns `402` instead of incorrectly reporting that the key was not found.



## One Place Where I Overrode AI's Suggestion

During the initial design of the project, AI suggested using streaming responses because streaming is common in production LLM applications and provides a better perceived user experience.

However, before making the decision, I spent some time understanding the differences between streaming and non-streaming LLM responses. For this project, I chose non-streaming responses because they keep the request lifecycle simpler, especially for provider fallback, token accounting, error handling, and usage logging.

The tradeoff is that the caller has to wait for the complete response before receiving any output, which increases perceived latency. For the scope of this gateway, I decided that implementation simplicity and correctness were more important than the latency benefit of streaming.

## How I Stayed in Control of AI-Generated Code

I paid particular attention to the parts of the generated or AI-assisted code that affected credentials, authentication, budgets, and provider calls.

Provider credentials and the admin secret are stored in environment variables rather than being hard-coded or committed to the repository. For virtual API keys, the raw key is returned only when the key is created. I use SHA-256 to hash the virtual key and store only the hash in MongoDB, so authentication is performed by hashing the incoming key and comparing it against the stored value.

For budget enforcement, I did not rely only on whether the code looked correct. I created keys with small token budgets and manually tested that requests were actually rejected with a `402` response when their usage exceeded the available budget. I also inspected the MongoDB documents to verify that token usage and usage logs matched the behavior I expected.

For provider fallback, I intentionally made the Groq credentials invalid and verified that the request was successfully routed to Gemini. This helped me verify the behavior of the generated code through actual failure scenarios rather than assuming that the fallback logic worked.

## Something I Learned From Scratch

Two of the main concepts I learned more deeply while building this project were streaming vs. non-streaming LLM responses and atomic budget enforcement under concurrency.

Before this assignment, I did not fully understand the practical differences between streaming and non-streaming responses in an LLM gateway. I learned how streaming affects the response lifecycle, error handling, fallback behavior, and usage accounting, which helped me make the decision to use non-streaming responses for this implementation.

I also learned more about concurrency and atomic database operations. A simple read of the remaining budget followed by a later update is not sufficient when multiple requests can arrive at the same time, because both requests may read the same remaining budget before either updates it.

To address this, I learned how to use an atomic MongoDB `findOneAndUpdate` with a conditional `$expr` so the budget check and token increment happen as a single database operation. I also learned that atomic database accounting does not completely solve provider-side overspending, because the actual token count is only known after the LLM provider has already processed the request. This led me to understand why a stronger production implementation would use a reserve-then-reconcile approach.
