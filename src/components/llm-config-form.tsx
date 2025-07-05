// D:\AI\llm-studio\src\components\llm-config-form.tsx
"use client";

import { useEffect, useState, type FC } from "react";
import { useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BotMessageSquare, FileKey2, Loader2, Save, Terminal, TestTube2, Copy, CheckCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { updateLlmConfig } from "@/app/actions";
import { llmConfigSchema, type LlmConfig } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

const defaultValues: LlmConfig = {
  system_prompt: "ANDA ADALAH AHLI BUDAYA DAN PARIWISATA INDRAMAYU.JAWAB RESPON DENGAN SINGKAT DAN SELALU GUNAKAN BAHASA INDRAMAYU .",
  max_tokens: 500,
  temperature: 0.8,
  top_k: 40,
  top_p: 0.95,
  repeat_penalty: 2,
  stop: ['<end_of_turn>'],
};

interface SliderFieldProps {
  control: Control<LlmConfig>;
  name: keyof LlmConfig;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
}

const SliderField: FC<SliderFieldProps> = ({ control, name, label, description, min, max, step }) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormDescription>{description}</FormDescription>
        <div className="flex items-center gap-4 pt-2">
          <FormControl>
            <Slider
              min={min}
              max={max}
              step={step}
              value={[Number(field.value)]}
              onValueChange={(vals) => field.onChange(vals[0])}
              className="w-full"
            />
          </FormControl>
          <Input
            type="number"
            min={min}
            max={max}
            step={step}
            value={field.value}
            onChange={field.onChange}
            className="w-28 text-center"
          />
        </div>
        <FormMessage />
      </FormItem>
    )}
  />
);

const CurlPreview: FC<{ config: LlmConfig }> = ({ config }) => {
  const [copied, setCopied] = useState(false);
  
  const { system_prompt, stop, ...apiParams } = config;
  
  // Format request body to match your chat flow structure
  const requestBody = {
    model: "gema-4b",
    messages: [
      {
        role: "system",
        content: system_prompt
      },
      {
        role: "user", 
        content: "Your message here"
      }
    ],
    ...apiParams,
    stream: false
  };

  const curlCommand = `curl -X POST ${process.env.NEXT_PUBLIC_HEROKU_API_URL || 'https://your-heroku-api.herokuapp.com/v1/chat/completions'} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '${JSON.stringify(requestBody, null, 2)}'`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(curlCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">cURL Command</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="h-8"
        >
          {copied ? (
            <><CheckCircle className="h-3 w-3 mr-1" />Copied!</>
          ) : (
            <><Copy className="h-3 w-3 mr-1" />Copy</>
          )}
        </Button>
      </div>
      <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs text-muted-foreground whitespace-pre-wrap">
        <code>{curlCommand}</code>
      </pre>
    </div>
  );
};

const TestConnection: FC<{ config: LlmConfig }> = ({ config }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const { toast } = useToast();

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/test-llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: "Hello, are you working?",
          config: config
        }),
      });

      if (!response.ok) {
        throw new Error(`Test failed: ${response.status}`);
      }

      const data = await response.json();
      setTestResult(data.success ? 'Connection successful!' : `Error: ${data.message}`);
      
      toast({
        title: data.success ? "Connection Test Passed" : "Connection Test Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestResult(`Connection failed: ${errorMessage}`);
      toast({
        title: "Connection Test Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleTest}
        disabled={testing}
        variant="outline"
        className="w-full"
      >
        {testing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Testing Connection...
          </>
        ) : (
          <>
            <TestTube2 className="mr-2 h-4 w-4" />
            Test Connection
          </>
        )}
      </Button>
      
      {testResult && (
        <div className={`p-3 rounded-lg text-sm ${
          testResult.includes('successful') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {testResult}
        </div>
      )}
    </div>
  );
};

export function LlmConfigForm() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<LlmConfig>(defaultValues);

  const form = useForm<LlmConfig>({
    resolver: zodResolver(llmConfigSchema),
    defaultValues,
    mode: "onChange",
  });
  
  useEffect(() => {
    try {
      const savedConfigRaw = localStorage.getItem("llmConfig");
      if (savedConfigRaw) {
        const savedConfig = JSON.parse(savedConfigRaw);
        const parsed = llmConfigSchema.safeParse(savedConfig);
        if (parsed.success) {
          form.reset(parsed.data);
          setCurrentConfig(parsed.data);
        } else {
          console.error("Invalid LLM config in localStorage, using defaults.", parsed.error);
          toast({
            title: "Invalid Configuration",
            description: "Loaded default settings due to invalid saved config.",
            variant: "destructive"
          });
        }
      }
    } catch (e) {
      console.error("Failed to parse llmConfig from localStorage, using defaults.", e);
      toast({
        title: "Configuration Load Error",
        description: "Using default settings due to corrupted saved config.",
        variant: "destructive"
      });
    }
  }, [form, toast]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      const parsed = llmConfigSchema.safeParse(value);
      if (parsed.success) {
        setCurrentConfig(parsed.data);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  async function onSubmit(data: LlmConfig) {
    setIsSaving(true);
    try {
      const result = await updateLlmConfig(data);
      
      if (result.success) {
        toast({
          title: "Configuration Saved!",
          description: result.message,
        });
        
        // Save to localStorage
        try {
          localStorage.setItem("llmConfig", JSON.stringify(data));
        } catch (e) {
          toast({
            variant: "destructive",
            title: "Local Storage Error",
            description: "Config saved to server but couldn't persist locally.",
          });
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <BotMessageSquare className="h-6 w-6 text-accent" />
                <div>
                  <CardTitle>System Prompt</CardTitle>
                  <CardDescription>Define the AI's personality and instructions. This will be prepended to every conversation.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="system_prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="e.g. You are a helpful assistant that provides accurate information about Indramayu culture and tourism."
                          className="min-h-[120px] resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Current length: {field.value?.length || 0} characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <TestTube2 className="h-6 w-6 text-accent" />
                <div>
                  <CardTitle>Sampling Parameters</CardTitle>
                  <CardDescription>Control the randomness and creativity of the output.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <SliderField 
                  control={form.control} 
                  name="temperature" 
                  label="Temperature" 
                  description="Higher values make output more random, lower values make it more deterministic." 
                  min={0} 
                  max={2} 
                  step={0.01} 
                />
                <SliderField 
                  control={form.control} 
                  name="top_k" 
                  label="Top K" 
                  description="Limits sampling to the K most likely tokens." 
                  min={1} 
                  max={100} 
                  step={1} 
                />
                <SliderField 
                  control={form.control} 
                  name="top_p" 
                  label="Top P" 
                  description="Samples from tokens with cumulative probability up to P." 
                  min={0} 
                  max={1} 
                  step={0.01} 
                />
                <SliderField 
                  control={form.control} 
                  name="repeat_penalty" 
                  label="Repeat Penalty" 
                  description="Penalizes repeated tokens to encourage diversity." 
                  min={1} 
                  max={2} 
                  step={0.01} 
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <FileKey2 className="h-6 w-6 text-accent" />
                <div>
                  <CardTitle>Generation Control</CardTitle>
                  <CardDescription>Manage the length and stopping points of the response.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="max_tokens"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Tokens</FormLabel>
                      <FormDescription>The maximum number of tokens to generate (1-4096).</FormDescription>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1}
                          max={4096}
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stop"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stop Sequences</FormLabel>
                      <FormDescription>Sequences where the AI will stop generating. Separate with commas.</FormDescription>
                      <FormControl>
                        <Input
                          placeholder="e.g. <end_of_turn>, Human:, \n\n"
                          value={Array.isArray(field.value) ? field.value.join(", ") : ""}
                          onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-8">
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <Terminal className="h-6 w-6 text-accent" />
                  <div>
                    <CardTitle>API Request Preview</CardTitle>
                    <CardDescription>Preview how your settings will be sent to the API.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={JSON.stringify(currentConfig)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CurlPreview config={currentConfig} />
                    </motion.div>
                  </AnimatePresence>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Test Connection</CardTitle>
                  <CardDescription>Test if your LLM API is responding correctly.</CardDescription>
                </CardHeader>
                <CardContent>
                  <TestConnection config={currentConfig} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Save Configuration</CardTitle>
                  <CardDescription>Persist your changes to be used in all future API requests.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button type="submit" className="w-full" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
