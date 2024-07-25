import { blue, bold, cyan, green, italic, red, strikethrough, yellow } from 'chalk';
import nlp from 'compromise';
import dayjs from 'dayjs';

interface Message {
  kind: 'START' | 'SUCCESS' | 'FAILURE';
  timestamp: Date;
  text: string;
}

interface StartMessage extends Message {
  kind: 'START';
  args?: any;
}

interface SuccessMessage extends Message {
  kind: 'SUCCESS';
  args?: any,
  result?: any
}

interface FailureMessage extends Message {
  kind: 'FAILURE';
  args?: any;
  error?: Error;
}

function isStartMessage(message: Message): message is StartMessage {
  return message.kind === 'START';
}

function isSuccessMessage(message: Message): message is SuccessMessage {
  return message.kind === 'SUCCESS';
}

function isFailureMessage(message: Message): message is FailureMessage {
  return message.kind === 'FAILURE';
}

type StartAction = (args: any[]) => StartMessage;
type SuccessAction = (args: any[], result: any) => SuccessMessage;
type FailureAction = (error: Error) => FailureMessage;

interface Actions {
  start: StartAction;
  success: SuccessAction;
  failure: FailureAction;
}

export function log(startText: string) {
  const actions: Actions | null = parseAction(startText);

  return function log(target: Function, context: DecoratorContext) {
    if (context.kind === 'method') {
      return function (...args: any[]) {
        try {
          if (actions) console.debug(formatMessage(actions.start(args)));

          // @ts-ignore
          const result = target.call(this, ...args);

          if (actions) console.info(formatMessage(actions.success(args, result)));

          return result;
        } catch (error: unknown) {
          if (actions?.failure) console.error(formatMessage(actions.failure(error as Error)));

          throw error;
        }
      };
    }
  };
}

function formatMessage(message: Message): string {
  const timestamp: string = yellow(dayjs(message.timestamp).toISOString());

  const text: string = (
    isStartMessage(message)
      ? [italic(message.text), message.args]
      : isSuccessMessage(message)
        ? [bold(green(message.text)), blue(message.args), cyan(message.result)]
        : isFailureMessage(message)
          ? [strikethrough(red(message.text)), message.args]
          : [message.text]
  )
    .join('; ');

  return `${timestamp}: ${text}`;
}

function parseAction(startText: string): Actions | null {
  let doc = nlp(startText);

  doc.verbs().toPastTense();
  const successText: string = doc.text();

  doc.verbs().toNegative();
  const failureText: string = doc.text();

  try {
    const start: StartAction = makeStartAction(startText);
    const success: SuccessAction = makeSuccessAction(successText);
    const failure: FailureAction = makeFailureAction(failureText);

    return {
      start,
      success,
      failure
    };
  } catch (error: unknown) {
    return null;
  }
}

function makeStartAction(text: string): StartAction {
  return (args: any[]) => ({
    kind: 'START',
    timestamp: new Date(),
    text,
    ...(args.length ? { args: JSON.stringify(args) } : {})
  });
}

function makeSuccessAction(text: string): SuccessAction {
  return (args: any[], result: any) => ({
    kind: 'SUCCESS',
    timestamp: new Date(),
    text,
    ...(args.length ? { args: JSON.stringify(args) } : {}),
    ...(result ? { result } : {})
  });
}

function makeFailureAction(text: string): FailureAction {
  return (error: Error) => {
    const { message }: Error = error;

    return {
      kind: 'FAILURE',
      timestamp: new Date(),
      text: message
        ? `${text} because ${message}`
        : text,
      ...(error ? { error } : {})
    };
  };
}
