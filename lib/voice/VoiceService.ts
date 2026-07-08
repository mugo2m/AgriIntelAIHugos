// lib/voice/VoiceService.ts - Browser TTS only (no Gooey)
"use client";

import { toast } from "sonner";
import SpeechToText from "./speechToText";
import TextToSpeech from "./textToSpeech";
import { getLanguageFromCountry } from "@/lib/config/language";

export interface VoiceMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
}

interface VoiceServiceConfig {
  interviewId: string;
  userId: string;
  type: "practice" | "review";
  language?: string;
  country?: string;
  speechRate?: number;
  speechVolume?: number;
  farmerName?: string;
}

export class VoiceService {
  private state: VoiceState = {
    isListening: false,
    isSpeaking: false,
    isProcessing: false,
    transcript: "",
    error: null,
  };

  private messages: VoiceMessage[] = [];
  private interviewId: string;
  private userId: string;
  private type: "practice" | "review";
  private interviewQuestions: string[] = [];
  private currentQuestionIndex: number = 0;
  private isActive: boolean = false;
  private useHumanization: boolean = true;
  private isMicrophoneActive: boolean = false;
  private manualStop: boolean = false;
  private farmerName: string = "";
  private country: string = "";
  private language: string = 'en-US';
  private nameUsageCount: number = 0;

  private isAISpeaking: boolean = false;
  private lastUserTranscript: string = "";
  private postSpeechTimeout: NodeJS.Timeout | null = null;
  private autoRestartTimeout: NodeJS.Timeout | null = null;
  private autoRestartAttempts: number = 0;
  private readonly MAX_AUTO_RESTART_ATTEMPTS = 10;

  private speechToText: SpeechToText | null = null;
  private textToSpeech: TextToSpeech | null = null;

  private onStateChangeCallback: ((state: VoiceState) => void) | null = null;
  private onUpdateCallback: ((messages: VoiceMessage[]) => void) | null = null;
  private onCompleteCallback: ((data: any) => void) | null = null;

  constructor(config: VoiceServiceConfig) {
    this.interviewId = config.interviewId;
    this.userId = config.userId;
    this.type = config.type;
    this.farmerName = config.farmerName || "Farmer";
    this.country = config.country || 'kenya';

    // Set language based on country or provided language
    this.language = config.language || getLanguageFromCountry(this.country);

    console.log(`VoiceService: Initialized for farmer: ${this.farmerName} (Country: ${this.country}, Language: ${this.language})`);

    this.speechToText = new SpeechToText();
    this.textToSpeech = new TextToSpeech({
      language: this.language,
      rate: config.speechRate || 1.0,  // ✅ NORMAL SPEED
      volume: config.speechVolume || 1.0,
      pitch: 1.1,
      preferFemale: true // ✅ Ensure female voices are preferred
    });

    if (this.speechToText) {
      this.speechToText.onResult(this.handleUserTranscript.bind(this));
      this.speechToText.setLanguage(this.language);
      this.speechToText.setInterviewMode(true);

      console.log(`VoiceService: SpeechToText initialized with language: ${this.language}`);

      setTimeout(() => {
        this.speechToText?.checkMicrophonePermissions().then(granted => {
          if (!granted) {
            toast.error("Please allow microphone access to use voice features");
          }
        });
      }, 1000);
    }
  }

  // Method to set country and update language
  public setCountry(country: string): void {
    this.country = country;
    this.language = getLanguageFromCountry(country);

    if (this.speechToText) {
      this.speechToText.setLanguage(this.language);
    }
    if (this.textToSpeech) {
      this.textToSpeech.setLanguage(this.language);
    }

    console.log(`VoiceService: Country set to ${country}, language updated to ${this.language}`);
  }

  public setFarmerName(name: string): void {
    this.farmerName = name;
    this.nameUsageCount = 0;
    console.log(`Farmer name set to: ${name}`);
  }

  private personalizeText(text: string): string {
    if (!this.farmerName) return text;

    this.nameUsageCount++;
    const useName = this.nameUsageCount % 3 === 0;

    let personalized = text
      .replace(/\b(?:farmer|user)\b/gi, useName ? this.farmerName : 'the farmer')
      .replace(/\byour\b/gi, useName ? `the ${this.farmerName}'s` : 'your')
      .replace(/\byou\b/gi, useName ? this.farmerName : 'you');

    return personalized;
  }

  private addBusinessFlavor(text: string): string {
    const businessPhrases = [
      `Remember, this is your business. `,
      `Think profit. `,
      `Produce more with less. `,
      `More money in your pocket. `,
      `This is your enterprise. `,
      `Every shilling counts. `,
      `Make every shilling work for you. `,
      `Your farm is an investment. `,
      `Maximize your returns. `,
    ];

    if (text.includes('investment') || text.includes('cost') || text.includes('profit') ||
        text.includes('margin') || text.includes('recommendation')) {
      const randomPhrase = businessPhrases[Math.floor(Math.random() * businessPhrases.length)];
      return randomPhrase + text;
    }

    return text;
  }

  private cleanText(text: any): string {
    // Handle non-string inputs
    if (text === null || text === undefined) {
      return '';
    }

    if (typeof text !== 'string') {
      console.warn('VoiceService.cleanText received non-string:', typeof text, text);
      return String(text);
    }

    return text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      .replace(/\*\*\*/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s?/g, '')
      .replace(/_/g, '')
      .replace(/~/g, '')
      .replace(/`/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private handleUserTranscript = (text: string, isFinal: boolean): void => {
    console.log(`Transcript: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}", isFinal: ${isFinal}`);

    const cleanedText = this.cleanText(text);
    const lowerText = cleanedText.toLowerCase();

    const isLikelyAISpeech =
      this.isAISpeaking ||
      lowerText.includes('recommendation') ||
      lowerText.includes('soil testing') ||
      lowerText.includes('terracing') ||
      lowerText.includes('contour farming') ||
      lowerText.includes('mulching') ||
      lowerText.includes('dap') ||
      lowerText.includes('can fertilizer') ||
      lowerText.includes('let me see') ||
      lowerText.includes('well') ||
      lowerText.includes('alright') ||
      lowerText.includes('great') ||
      lowerText.includes('hmm') ||
      lowerText.includes('interesting') ||
      lowerText.includes('monitor for pests') ||
      lowerText === this.lastUserTranscript;

    if (isLikelyAISpeech) {
      console.log("Ignoring likely AI speech");
      return;
    }

    console.log("User speech detected");
    this.lastUserTranscript = cleanedText;
    this.updateState({ transcript: cleanedText });

    if (!this.isActive || !this.isMicrophoneActive) {
      return;
    }

    if (isFinal) {
      console.log("Final transcript captured");
    }
  };

  setHumanization(enabled: boolean): void {
    this.useHumanization = enabled;
    if (this.textToSpeech) {
      this.textToSpeech.setHumanization(enabled);
    }
  }

  public setInterviewQuestions(questions: string[]): void {
    this.interviewQuestions = questions;
    console.log("Set", questions.length, "questions");
  }

  public async startInterview(): Promise<void> {
    console.log("Starting interview");

    if (this.interviewQuestions.length === 0) {
      throw new Error("No interview questions set");
    }

    this.isActive = true;
    this.manualStop = false;
    this.currentQuestionIndex = 0;
    this.messages = [];
    this.nameUsageCount = 0;
    this.updateState({
      isProcessing: true,
      transcript: ""
    });

    try {
      await this.speak(`Welcome! Let's start your farm interview. Remember, this is your business.`);
      await this.delay(1000);
      await this.askCurrentQuestion();
    } catch (error: any) {
      console.error("Failed to start:", error);
      this.handleError(error.message);
    }
  }

  private async askCurrentQuestion(): Promise<void> {
    console.log(`askCurrentQuestion: index=${this.currentQuestionIndex}, total=${this.interviewQuestions.length}`);

    if (!this.isActive) {
      console.log("Not active, returning");
      return;
    }

    if (this.currentQuestionIndex >= this.interviewQuestions.length) {
      console.log("COMPLETION CONDITION MET");
      await this.completeInterview();
      return;
    }

    const question = this.interviewQuestions[this.currentQuestionIndex];
    console.log(`Asking question ${this.currentQuestionIndex + 1}`);

    const questionMessage: VoiceMessage = {
      role: "assistant",
      content: `Question ${this.currentQuestionIndex + 1}: ${question}`,
      timestamp: Date.now(),
    };
    this.messages.push(questionMessage);
    this.onUpdateCallback?.(this.messages);

    await this.speak(`Question ${this.currentQuestionIndex + 1}. ${question}`);

    await this.delay(500);
    await this.startListening();
  }

  private async startListening(): Promise<void> {
    console.log(`Start listening for question ${this.currentQuestionIndex + 1}`);

    if (!this.isActive || !this.speechToText) {
      console.log("Cannot start listening");
      return;
    }

    if (this.isAISpeaking) {
      console.log("Not starting listening - AI is speaking");
      return;
    }

    try {
      if (this.speechToText.getIsListening()) {
        this.speechToText.stop();
        await this.delay(300);
      }
    } catch (e) {}

    this.updateState({
      isListening: true,
      isSpeaking: false
    });

    this.isMicrophoneActive = true;
    this.manualStop = false;

    toast.info(`Question ${this.currentQuestionIndex + 1} - Speak your answer`);

    try {
      this.speechToText.clearTranscript();
      await this.speechToText.start();
      console.log(`Listening started successfully with language: ${this.language}`);
    } catch (error: any) {
      console.error("Failed to start listening:", error);
      this.updateState({ isListening: false });
      this.isMicrophoneActive = false;
      toast.error("Microphone access failed. Please check permissions.");
    }
  }

  public stopListening(): void {
    console.log("VoiceService: Stopping listening");

    if (this.autoRestartTimeout) {
      clearTimeout(this.autoRestartTimeout);
      this.autoRestartTimeout = null;
    }

    if (this.postSpeechTimeout) {
      clearTimeout(this.postSpeechTimeout);
      this.postSpeechTimeout = null;
    }

    if (this.speechToText && this.speechToText.getIsListening()) {
      try {
        this.speechToText.stop();
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
    }

    this.isMicrophoneActive = false;
    this.updateState({ isListening: false });
    this.autoRestartAttempts = 0;
  }

  public async listenForQuestion(): Promise<void> {
    console.log("Listening for farmer question");

    if (!this.isActive || !this.speechToText) {
      console.log("Cannot start listening");
      return;
    }

    if (this.isAISpeaking) {
      console.log("Not starting listening - AI is speaking");
      toast.info("Please wait for AI to finish speaking");
      return;
    }

    try {
      if (this.speechToText.getIsListening()) {
        this.speechToText.stop();
        await this.delay(300);
      }
    } catch (e) {}

    this.updateState({
      isListening: true,
      isSpeaking: false
    });

    this.isMicrophoneActive = true;
    this.manualStop = false;

    toast.info(`Listening for your question...`);

    try {
      this.speechToText.clearTranscript();
      await this.speechToText.start();
      console.log(`Listening started successfully with language: ${this.language}`);
    } catch (error: any) {
      console.error("Failed to start listening:", error);
      this.updateState({ isListening: false });
      this.isMicrophoneActive = false;
      toast.error("Microphone access failed. Please check permissions.");
    }
  }

  private humanizeInterviewQuestion(text: string): string {
    if (!this.useHumanization) return text;

    let humanized = text
      .replace(/Question \d+\. /g, (match) => {
        const variations = ['Next question. ', 'Moving on. ', 'Alright. ', 'Great. '];
        return variations[Math.floor(Math.random() * variations.length)] + match;
      })
      .replace(/\. /g, '. ... ')
      .replace(/\?/g, '? ... ');

    return humanized;
  }

  public async submitAnswer(): Promise<void> {
    console.log(`Submit answer for question ${this.currentQuestionIndex + 1}`);

    if (!this.isActive) {
      toast.error("Interview not active");
      return;
    }

    this.isMicrophoneActive = false;
    this.manualStop = true;
    this.speechToText?.stop();
    this.updateState({ isListening: false });

    const answerText = this.state.transcript.trim();

    if (!answerText) {
      console.log("No answer to submit");
      toast.warning("Please speak an answer first");

      this.isMicrophoneActive = true;
      this.manualStop = false;
      await this.startListening();
      return;
    }

    if (answerText.length < 3) {
      console.log("Answer too short");
      toast.warning("Please provide a longer answer");

      this.isMicrophoneActive = true;
      this.manualStop = false;
      await this.startListening();
      return;
    }

    const wordCount = answerText.split(/\s+/).length;
    if (wordCount < 3) {
      console.log("Answer too short - only", wordCount, "words");
      toast.warning("Please provide a more detailed answer");

      this.isMicrophoneActive = true;
      this.manualStop = false;
      await this.startListening();
      return;
    }

    console.log(`Submitting answer (${answerText.length} chars, ${wordCount} words)`);

    const answerMessage: VoiceMessage = {
      role: "user",
      content: answerText,
      timestamp: Date.now(),
    };
    this.messages.push(answerMessage);
    this.onUpdateCallback?.(this.messages);

    toast.success(`Thanks! Answer submitted`);

    await this.speak(`Thank you. Good answer.`);
    await this.delay(800);

    this.currentQuestionIndex++;
    this.updateState({ transcript: "" });

    await this.askCurrentQuestion();
  }

  public async skipQuestion(): Promise<void> {
    console.log(`Skip question ${this.currentQuestionIndex + 1}`);

    if (!this.isActive) return;

    this.isMicrophoneActive = false;
    this.manualStop = true;
    this.speechToText?.stop();
    this.updateState({ isListening: false });

    const skipMessage: VoiceMessage = {
      role: "user",
      content: `[Skipped question ${this.currentQuestionIndex + 1}]`,
      timestamp: Date.now(),
    };
    this.messages.push(skipMessage);
    this.onUpdateCallback?.(this.messages);

    toast.info(`Question ${this.currentQuestionIndex + 1} skipped`);

    await this.speak(`No problem. Moving on.`);
    await this.delay(800);

    this.currentQuestionIndex++;
    this.updateState({ transcript: "" });
    await this.askCurrentQuestion();
  }

  private async completeInterview(): Promise<void> {
    console.log("COMPLETE INTERVIEW CALLED");

    if (!this.isActive) {
      console.log("Not active, cannot complete");
      return;
    }

    this.isActive = false;
    this.isMicrophoneActive = false;
    this.manualStop = true;
    this.speechToText?.stop();

    this.updateState({
      isListening: false,
      isSpeaking: false,
      isProcessing: true
    });

    await this.speak(`Great job! Interview completed. Now let's look at how to put more money in your pocket with your farm enterprise.`);

    const userAnswers = this.messages.filter(m => m.role === 'user');
    console.log(`Interview completed with ${userAnswers.length} answers`);

    const completionData = {
      success: true,
      interviewId: this.interviewId,
      userId: this.userId,
      feedbackId: `local-${Date.now()}`,
      questionsAsked: this.interviewQuestions.length,
      answersGiven: userAnswers.length,
      transcript: this.messages,
      timestamp: new Date().toISOString(),
      fallback: false
    };

    if (this.onCompleteCallback) {
      console.log("CALLING ONCOMPLETE CALLBACK");
      this.onCompleteCallback(completionData);
      console.log("ONCOMPLETE CALLBACK EXECUTED");
    }

    this.updateState({ isProcessing: false });
    console.log("Interview completion process finished");
  }

  private async speak(text: string): Promise<void> {
    if (!this.textToSpeech) {
      console.log("AI:", text);
      return;
    }

    const cleanedText = this.cleanText(text);
    let personalizedText = this.personalizeText(cleanedText);
    personalizedText = this.addBusinessFlavor(personalizedText);

    this.isAISpeaking = true;
    this.stopListening();

    this.updateState({ isSpeaking: true });

    try {
      await this.textToSpeech.speak(personalizedText);
    } catch (error) {
      console.log("AI (fallback):", personalizedText);
    } finally {
      this.updateState({ isSpeaking: false });
      this.isAISpeaking = false;
      this.schedulePostSpeechListening();
    }
  }

  public async speakStreaming(text: string): Promise<void> {
    if (!this.textToSpeech) {
      console.log("AI:", text);
      return;
    }

    const cleanedText = this.cleanText(text);
    let personalizedText = this.personalizeText(cleanedText);
    personalizedText = this.addBusinessFlavor(personalizedText);

    this.isAISpeaking = true;
    this.stopListening();

    this.updateState({ isSpeaking: true });

    try {
      const sentences = personalizedText.match(/[^.!?]+[.!?]+/g) || [personalizedText];

      for (const sentence of sentences) {
        if (!this.isActive && this.type !== "review") break;
        await this.textToSpeech.speak(sentence);
        await this.delay(500);
      }
    } catch (error) {
      console.log("AI (fallback):", personalizedText);
    } finally {
      this.updateState({ isSpeaking: false });
      this.isAISpeaking = false;
      this.schedulePostSpeechListening();
    }
  }

  private schedulePostSpeechListening(): void {
    if (this.postSpeechTimeout) {
      clearTimeout(this.postSpeechTimeout);
    }

    this.postSpeechTimeout = setTimeout(() => {
      if (!this.isAISpeaking && this.isActive && !this.manualStop) {
        console.log("Restarting listening after AI speech");
        if (this.type === "review" || this.currentQuestionIndex < this.interviewQuestions.length) {
          this.startListening().catch(err => {
            console.error("Failed to restart listening:", err);
          });
        }
      }
      this.postSpeechTimeout = null;
    }, 1000);  // ✅ REDUCED from 1500ms to 1000ms
  }

  public async speakRecommendations(recommendations: string[]): Promise<void> {
    if (!recommendations || recommendations.length === 0) return;

    await this.speakStreaming(`I have prepared personalized recommendations for your farm enterprise. Let me read them to you.`);
    await this.delay(1500);

    for (let i = 0; i < recommendations.length; i++) {
      const rec = recommendations[i];
      await this.speakStreaming(`Recommendation ${i + 1}: ${rec}`);
      await this.delay(1000);
    }

    await this.speakStreaming(`You can now ask me any questions about your farm. Remember, produce more with less - put more money in your pocket.`);
  }

  public async startFarmerSession(sessionData: any): Promise<void> {
    console.log(`Starting farmer session for ${this.farmerName}`);

    this.isActive = true;
    this.manualStop = false;
    this.messages = [];
    this.nameUsageCount = 0;

    if (sessionData?.country) {
      this.setCountry(sessionData.country);
    }

    this.updateState({
      isProcessing: false,
      transcript: ""
    });

    this.updateState({ isSpeaking: false, isListening: false });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private updateState(updates: Partial<VoiceState>): void {
    this.state = { ...this.state, ...updates };
    this.onStateChangeCallback?.(this.state);
  }

  private handleError(error: string): void {
    console.error("Error:", error);
    this.state.error = error;
    this.isActive = false;
    this.isMicrophoneActive = false;
  }

  public stop(): void {
    console.log("Stopping");
    this.isActive = false;
    this.isMicrophoneActive = false;
    this.manualStop = true;
    this.isAISpeaking = false;

    if (this.autoRestartTimeout) {
      clearTimeout(this.autoRestartTimeout);
      this.autoRestartTimeout = null;
    }

    if (this.postSpeechTimeout) {
      clearTimeout(this.postSpeechTimeout);
      this.postSpeechTimeout = null;
    }

    this.speechToText?.stop();
    this.textToSpeech?.stop();
    this.updateState({
      isListening: false,
      isSpeaking: false,
      isProcessing: false
    });
  }

  public getState(): VoiceState {
    return this.state;
  }

  public onStateChange(callback: (state: VoiceState) => void): void {
    this.onStateChangeCallback = callback;
  }

  public onUpdate(callback: (messages: VoiceMessage[]) => void): void {
    this.onUpdateCallback = callback;
  }

  public onComplete(callback: (data: any) => void): void {
    console.log("onComplete callback REGISTERED in VoiceService");
    this.onCompleteCallback = callback;
  }

  public destroy(): void {
    console.log("Destroying");
    this.stop();
    this.speechToText?.destroy();
    this.textToSpeech?.destroy();
    this.onStateChangeCallback = null;
    this.onUpdateCallback = null;
    this.onCompleteCallback = null;
    this.messages = [];
    this.interviewQuestions = [];
  }

  public getIsAISpeaking(): boolean {
    return this.isAISpeaking;
  }
}

export default VoiceService;