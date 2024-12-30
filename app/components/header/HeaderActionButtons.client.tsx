import { useStore } from '@nanostores/react';
import { ActionRunner, type ActionState } from '~/lib/runtime/action-runner';
import { chatStore } from '~/lib/stores/chat';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { webcontainer } from '~/lib/webcontainer';
import type { ActionCallbackData } from '~/lib/runtime/message-parser';
import type { BoltAction } from '~/types/actions';
import type { WebContainer } from '@webcontainer/api';
import { gitSetupScript } from '~/utils/isophomic-git';
import { toast } from 'react-toastify';
import { useEffect } from 'react';

interface HeaderActionButtonsProps { }

export function HeaderActionButtons({ }: HeaderActionButtonsProps) {
  const showWorkbench = useStore(workbenchStore.showWorkbench);
  const { showChat } = useStore(chatStore);

  const canHideChat = showWorkbench || !showChat;


  const actionRunner = new ActionRunner(webcontainer)


  return (
    <div className="flex">
      <div className="flex border border-bolt-elements-borderColor rounded-md overflow-hidden">
        <Button
          active={showChat}
          disabled={!canHideChat}
          onClick={() => {
            if (canHideChat) {
              chatStore.setKey('showChat', !showChat);
            }
          }}
        >
          <div className="i-ph:chat text-sm" />
        </Button>
        <div className="w-[1px] bg-bolt-elements-borderColor" />
        <Button
          active={showWorkbench}
          onClick={() => {
            if (showWorkbench && !showChat) {
              chatStore.setKey('showChat', true);
            }

            workbenchStore.showWorkbench.set(!showWorkbench);
          }}
        >
          <div className="i-ph:code-bold" />
        </Button>
      </div>

      <div className="flex border border-bolt-elements-borderColor rounded-md overflow-hidden ml-2">
        <Button
          // active={showChat}
          // disabled={!canHideChat}
          onClick={async () => {

            let res0 = await actionRunner.runShellActionCus("ls ./git-setup.js && echo 'File exists' || echo 'File does not exist'")
            console.log("RES:::",res0[0])
            const setupExists = !res0[0].includes("No such file or directory")
            console.log(setupExists)
            let out = await actionRunner.runShellActionCus("npm install --save isomorphic-git",false);
            const res = await actionRunner.runShellActionCus("isogit currentBranch");

            if (res && res.length) {
              if (res[0].includes("Could not find HEAD")) {
                //check if the setup file is already created
                if (setupExists) {
                  //execute the git-setup file
                  const res = await actionRunner.runShellActionCus("npm install dotenv && node git-setup.js", false);
                } else {
                  console.log("git not initialized. Initializing...")
                  //generate git setup script with isomophic-git + create .env for variables in git-setup.js file
                  const command = `echo "${gitSetupScript()}" >> git-setup.js && echo "GITHUB_TOKEN=your_github_token_here\nGITHUB_USERNAME=your_github_username_here\nGITHUB_REPO=your_github_repo_name_here\nAUTHOR_NAME=''\nAUTHOR_EMAIL=''" >> .env`;
                  const res = await actionRunner.runShellActionCus(command);
                
                  //show a toast to inform user to update the .env with the correct git values
                  toast.info("Please update your git credentials in the .env file and click the git button again to continue")
                }


              } else {
                //git is already initiallized lets execute pull + push
                console.log("RUNNING ELSE STATEMENT-----")
                await actionRunner.runShellActionCus("isogit fetch --remote=origin && isogit push ", false);
                toast.info("Git action completed")
              }
            }


          }}
        >
          <div className="i-ph:git-diff text-sm" />
        </Button>

      </div>
    </div>
  );
}

interface ButtonProps {
  active?: boolean;
  disabled?: boolean;
  children?: any;
  onClick?: VoidFunction;
}


async function isGitInitialized(webcontainer: WebContainer): Promise<boolean> {
  try {
    const process = await webcontainer.spawn('jsh', ['-c', 'isogit status'], {
      env: { npm_config_yes: true },
    });
    const output = await process.output;
    console.log("LOG:::", output)
    return true
    //('not a git repository');
  } catch (error) {
    console.log(error)
    // If git command fails, it's likely not initialized
    return false;
  }
}

function createFileAction(content: string, filePath: string = '.'): ActionCallbackData {
  const randomId = Math.floor(Math.random() * (100000 - 100 + 1)) + 100;
  let data: ActionCallbackData = {
    artifactId: randomId.toString(),
    messageId: randomId.toString(),
    actionId: randomId.toString(),
    action: {
      type: 'file',
      filePath: filePath,
      content: content
    }
  };
  return data;
}


function gitCommandsExc(actionRunner: ActionRunner, command: string, expectOuput: false) {
  let gitAction: BoltAction = {
    content: `${command}`,
    type: 'shell'
  }


  //run git actions in shell
  const actions = actionRunner.actions.get();
  const hasActions = Object.keys(actions).length > 0;

  //randomize id generation
  //use same id for message_id and artifact_id
  const randomInt = Math.floor(Math.random() * (100000 - 100 + 1)) + 100;
  const id = randomInt.toString();

  const data: ActionCallbackData = {
    artifactId: id,
    messageId: id,
    actionId: id,
    action: gitAction as BoltAction
  }


  actionRunner.addAction(data)

  if (hasActions) {
    console.log("Action added to runner...")
  } else {
    actionRunner.runAction(data)
  }
}

function Button({ active = false, disabled = false, children, onClick }: ButtonProps) {
  return (
    <button
      className={classNames('flex items-center p-1.5', {
        'bg-bolt-elements-item-backgroundDefault hover:bg-bolt-elements-item-backgroundActive text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary':
          !active,
        'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent': active && !disabled,
        'bg-bolt-elements-item-backgroundDefault text-alpha-gray-20 dark:text-alpha-white-20 cursor-not-allowed':
          disabled,
      })}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
