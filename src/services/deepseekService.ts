import axios from "axios";

export class DeepseekService {
    constructor(private apiKey: string) {}

    async getCompletion(prompt: string): Promise<string> {
        const response = await axios.post(
            "https://api.deepseek.com/chat/completions",
            {
                model: "deepseek-chat",
                messages: [
                    {
                        role: "user",
                        content: `Complete this code:\n${prompt}`,
                    },
                ],
            },
            {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return response.data.choices[0].message.content;
    }
}
