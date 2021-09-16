import React, { createContext, useState, useEffect, useContext } from "react";
import { AccountContext } from './account';


import Whatshot from '@material-ui/icons/Whatshot';
import Hotel from '@material-ui/icons/Hotel';
import BathtubIcon from '@material-ui/icons/Bathtub';
import ChildCareIcon from '@material-ui/icons/ChildCare';
import SportsEsportsIcon from '@material-ui/icons/SportsEsports';
import FavoriteIcon from '@material-ui/icons/Favorite';
import BN from "bn.js";

/**
 * Updates the dragons game state and data using given contracts.
 * @param {*} contracts
 * @param {*} dispatch
 */
async function updateDragonState(accountState: any, dispatch: any) {
  const { contracts, resetContracts } = accountState;
  try {
    const dragons = await Promise.all(contracts.Dragons.map(async (dragon: any) => {
      const name = await dragon.methods.name().call();
      const maxHealth = await dragon.methods.maxHealth().call();
      const health = await dragon.methods.health().call();
      const attackCooldown = await dragon.methods.attackCooldown().call();
      const playerTrust = await dragon.methods.trust(accountState.address).call();
      const healthRegeneration = await dragon.methods.healthRegeneration().call();
      const damage = await dragon.methods.damage().call();
      const canDragonAttack = await dragon.methods.canAttack().call();

      const canAttack = canDragonAttack && (new BN(playerTrust)).gte(new BN('4'));
      const canProposeBreed = (new BN(playerTrust)).gte(new BN('10'));
      const canAcceptBreed = (new BN(playerTrust)).gte(new BN('10'));

      interface AvailableAction {
        name: string,
        Icon: any,
        disabled?: boolean,
        isCallData: boolean,
        callData: Array<String>,
        call: (callData: any) => Promise<void>
      }

      const availableActions: Array<AvailableAction> = [
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
          name: 'Attack',
          Icon: Whatshot,
          disabled: !canAttack,
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
          name: 'Sleep',
          Icon: Hotel,
          isCallData: false,
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
    debugger
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