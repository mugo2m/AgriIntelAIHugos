// lib/voice/speechToText.ts - WITH LANGUAGE SUPPORT
"use client";

export interface SpeechToTextEvents {
  onStart?: () => void;
  onEnd?: () => void;
  onResult?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export class SpeechToText {
  private recognition: any = null;
  private isListening: boolean = false;
  private isInterviewMode: boolean = false;
  private language: string = 'en-US';
  private finalTranscript: string = '';
  private interimTranscript: string = '';
  private events: SpeechToTextEvents = {};
  private restartTimeout: NodeJS.Timeout | null = null;
  private autoRestart: boolean = true;
  private manualStop: boolean = false;

  constructor() {
    if (typeof window === 'undefined') return;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();

      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      this.setupEventHandlers();

      console.log(`SpeechToText: Initialized with language: ${this.language}`);
    } else {
      console.warn("SpeechToText: Speech Recognition API is not supported.");
    }
  }

  private setupEventHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.manualStop = false;
      console.log(`SpeechToText: Started listening (language: ${this.language})`);
      this.events.onStart?.();
    };

    this.recognition.onend = () => {
      console.log(`SpeechToText: Stopped listening, autoRestart: ${this.autoRestart}, manualStop: ${this.manualStop}`);

      if (this.autoRestart && !this.manualStop && this.isListening) {
        console.log("SpeechToText: Auto-restarting...");
        this.restartTimeout = setTimeout(() => {
          this.start().catch(e => console.error("Failed to restart:", e));
        }, 300);
      } else {
        this.isListening = false;
        this.events.onEnd?.();
      }
    };

    this.recognition.onerror = (event: any) => {
      console.log(`SpeechToText: Error: ${event.error}`);

      if (event.error === 'no-speech') {
        // No speech detected - just restart silently
        if (this.autoRestart && !this.manualStop) {
          this.restartTimeout = setTimeout(() => {
            this.start().catch(e => console.error("Failed to restart:", e));
          }, 300);
        }
      } else if (event.error === 'aborted') {
        // Normal stop - don't treat as error
        console.log("SpeechToText: Recognition aborted (normal)");
      } else {
        this.events.onError?.(`Recognition error: ${event.error}`);
      }
    };

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (final) {
        this.finalTranscript += ' ' + final;
        this.finalTranscript = this.finalTranscript.trim();

        if (this.isInterviewMode) {
          console.log(`SpeechToText (final): ${final}`);
        }

        this.events.onResult?.(final, true);
      }

      if (interim && this.isInterviewMode) {
        console.log(`SpeechToText (interim): ${interim}`);
        this.events.onResult?.(interim, false);
      }
    };
  }

  public async start(): Promise<void> {
    if (!this.recognition) {
      throw new Error("Speech recognition not supported");
    }

    // Clear any pending restart
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    try {
      // Check permissions first
      const granted = await this.checkMicrophonePermissions();
      if (!granted) {
        throw new Error("Microphone permission denied");
      }

      this.recognition.lang = this.language;
      this.recognition.start();
      console.log(`SpeechToText: Starting with language: ${this.language}`);
    } catch (error) {
      console.error("SpeechToText: Failed to start:", error);
      this.isListening = false;
      throw error;
    }
  }

  public stop(): void {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    this.autoRestart = false;
    this.manualStop = true;

    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        console.log("SpeechToText: Stopped");
      } catch (error) {
        console.error("SpeechToText: Error stopping:", error);
      }
    }

    this.isListening = false;
  }

  public abort(): void {
    this.autoRestart = false;
    this.manualStop = true;

    if (this.recognition && this.isListening) {
      try {
        this.recognition.abort();
        console.log("SpeechToText: Aborted");
      } catch (error) {
        console.error("SpeechToText: Error aborting:", error);
      }
    }

    this.isListening = false;
  }

  public setLanguage(language: string): void {
    this.language = language;
    console.log(`SpeechToText: Language set to ${language}`);

    // Update recognition if it exists
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  public setInterviewMode(enabled: boolean): void {
    this.isInterviewMode = enabled;
  }

  public clearTranscript(): void {
    this.finalTranscript = '';
    this.interimTranscript = '';
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public async checkMicrophonePermissions(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error("Microphone permission denied:", error);
      return false;
    }
  }

  public onStart(callback: () => void): void {
    this.events.onStart = callback;
  }

  public onEnd(callback: () => void): void {
    this.events.onEnd = callback;
  }

  public onResult(callback: (text: string, isFinal: boolean) => void): void {
    this.events.onResult = callback;
  }

  public onError(callback: (error: string) => void): void {
    this.events.onError = callback;
  }

  public destroy(): void {
    this.abort();
    this.recognition = null;
    this.events = {};
    console.log("SpeechToText: Destroyed");
  }
}

export default SpeechToText;