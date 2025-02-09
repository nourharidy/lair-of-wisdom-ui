import React, { createContext, useState, useEffect, useContext } from "react";
import { AccountContext } from './account';


import Whatshot from '@material-ui/icons/Whatshot';
import Fastfood from '@material-ui/icons/Fastfood';
import Hotel from '@material-ui/icons/Hotel';
import BathtubIcon from '@material-ui/icons/Bathtub';
import ChildCareIcon from '@material-ui/icons/ChildCare';
import SportsEsportsIcon from '@material-ui/icons/SportsEsports';
import FavoriteIcon from '@material-ui/icons/Favorite';
import Healing from '@material-ui/icons/Healing';
import BN from "bn.js";

const NEEDS_THRESHOLD = 5;

interface AvailableAction {
  name: string,
  Icon: any,
  disabled?: boolean,
  isCallData: boolean,
  callData: Array<String>,
  call: (callData: any) => Promise<void>
}

/**
 * Updates the dragons game state and data using given contracts.
 * @param {*} contracts
 * @param {*} dispatch
 */
async function updateDragonState(accountState: any, dispatch: any) {
  const { contracts, resetContracts } = accountState;
  try {
    const dragons = await Promise.all(contracts.Dragons.map(async (dragon: any) => {
      const [
        name,
        maxHealth,
        health,
        attackCooldown,
        playerTrust,
        healthRegeneration,
        damage,
        canDragonAttack,
        getHunger,
        getSleepiness,
        getUncleanliness,
        getBoredom
      ] = await Promise.all([
        dragon.methods.name().call(),
        dragon.methods.maxHealth().call(),
        dragon.methods.health().call(),
        dragon.methods.attackCooldown().call(),
        dragon.methods.trust(accountState.address).call(),
        dragon.methods.healthRegeneration().call(),
        dragon.methods.damage().call(),
        dragon.methods.canAttack().call(),
        dragon.methods.getHunger().call(),
        dragon.methods.getSleepiness().call(),
        dragon.methods.getUncleanliness().call(),
        dragon.methods.getBoredom().call()
      ])

      const canAttack = canDragonAttack && (new BN(playerTrust)).gte(new BN('4'));
      const canProposeBreed = (new BN(playerTrust)).gte(new BN('10'));
      const canAcceptBreed = (new BN(playerTrust)).gte(new BN('10'));

      const availableActions: Array<AvailableAction> = [
        {
          name: 'Attack',
          Icon: Whatshot,
          disabled: !(canAttack),
          isCallData: true,
          callData: ['address'],
          call: async (callData: any) => {
            await dragon.methods.attack(callData.address).send({
              from: accountState.address
            })
            resetContracts();
          }
        },
        {
          name: 'Feed',
          Icon: Fastfood,
          disabled: !(getHunger > NEEDS_THRESHOLD),
          isCallData: false,
          callData: [],
          call: async (callData: any) => {
            await dragon.methods.feed().send({
              from: accountState.address
            })
            resetContracts();
          }
        },
        {
          name: 'Accept Breed',
          Icon: ChildCareIcon,
          isCallData: true,
          disabled: !canAcceptBreed,
          callData: ['address', 'name'],
          call: async (callData: any) => {
            await dragon.methods.breed(callData.address, callData.name).send({
              from: accountState.address
            })
            resetContracts();
          }
        },
        {
          name: 'Sleep',
          Icon: Hotel,
          isCallData: false,
          disabled: !(getSleepiness > NEEDS_THRESHOLD),
          callData: [],
          call: async (callData: any) => {
            await dragon.methods.sleep().send({
              from: accountState.address
            })
            resetContracts();
          }
      },
      {
          name: 'Clean',
          Icon: BathtubIcon,
          isCallData: false,
          callData: [],
          disabled: !(getUncleanliness > NEEDS_THRESHOLD),
          call: async (callData: any) => {
            await dragon.methods.clean().send({
              from: accountState.address
            })
            resetContracts();
          }
        },
        {
          name: 'Play',
          Icon: SportsEsportsIcon,
          disabled: !(getBoredom > NEEDS_THRESHOLD),
          isCallData: false,
          callData: [],
          call: async (callData: any) => {
            await dragon.methods.play().send({
              from: accountState.address
            })
            resetContracts();
          }
        },
        {
          name: 'Heal',
          Icon: Healing,
          disabled: !(maxHealth - health >= healthRegeneration && playerTrust >= 1),
          isCallData: false,
          callData: [],
          call: async (callData: any) => {
            await dragon.methods.heal().send({
              from: accountState.address
            })
            resetContracts();
          }
        },
        {
          name: 'Propose Breed',
          Icon: FavoriteIcon,
          isCallData: true,
          disabled: !canProposeBreed,
          callData: ['address'],
          call: async (callData: any) => {
            await dragon.methods.proposeBreed(callData.address, callData.name).send({
              from: accountState.address
            })
            resetContracts();
          }
        }
      ];

      return {
        address: dragon.options.address,
        name,
        health,
        maxHealth,
        attackCooldown,
        healthRegeneration,
        playerTrust,
        damage,
        availableActions: availableActions.reverse()
      };
    }));
    dispatch((state: any) => {
      state.dragons = dragons;
      state.loaded = true;
      return { ...state };
    });
  } catch (err) {
    console.log(err)
    // TODO: Setup error handling.
  }
}

/**
 * Updates the full game state and data using given contracts.
 * @param {*} contracts 
 * @param {*} dispatch 
 */
async function updateGameState(accountState: any, dispatch: any) {
  updateDragonState(accountState, dispatch);
}

/**
 * Interface for the game state.
 */
interface GameState {
  dragons: [any?],
  loaded: boolean
}

const defaultGameState: GameState = {
  dragons: [],
  loaded: false
};

/**
 * React Context Object for game data.
 */
export const GameContext = createContext<GameState>(defaultGameState);

/**
 * Component mixer for the Game Context.
 * @param {*} param0 
 * @returns ReactComponent
 */
 const Game:React.FC<{}> = ({ children }: any) => {
  const { accountState } : any = useContext(AccountContext);
  const [gameState, dispatch] = useState<GameState>(defaultGameState);

  useEffect(() => {
    if (!accountState.contracts) return;
    updateGameState(accountState, dispatch);
  }, [accountState, accountState.contracts]);

  return <GameContext.Provider value={ gameState }>
    { children }
  </GameContext.Provider>;
}

export default Game
