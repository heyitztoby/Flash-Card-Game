import { Component, ViewChild, ElementRef, Renderer2 } from '@angular/core';
import { LocalStorageService } from 'src/services/LocalStorageService';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'Flash Card Game';
  highScore = 0;
  main = true;
  game = false;
  combi = false;
  countdown = false;
  endGame = false;
  timeLeft = 60;
  countdownTime = 3;
  countdownInterval: any;
  gameTimerInterval: any;
  currentScore = 0;
  firstNum = 0;
  secondNum = 0;
  combinationMap: Map<number, Array<number> | undefined> = new Map<
    number,
    Array<number> | undefined
  >();
  firstArray: any;
  secondArray: any;
  opSelected = 'plus';
  opDisplay = '+';
  combiFound = 0;
  inputDisabled = true;

  // Array of arithmetic operators
  operators = [
    {
      displayValue: '+',
      value: 'plus',
    },
    {
      displayValue: '-',
      value: 'minus',
    },
    {
      displayValue: '×',
      value: 'multiply',
    },
    {
      displayValue: '÷',
      value: 'divide',
    },
  ];

  @ViewChild('ansInput') ansInput!: ElementRef;

  constructor(
    private localStorage: LocalStorageService,
    private renderer: Renderer2
  ) {
    // Retrieving high score and combinations found from local storage
    this.highScore = Number.parseInt(localStorage.get('highscore') || '0');
    if (localStorage.get('combinations')) {
      this.combinationMap = new Map(
        JSON.parse(localStorage.get('combinations') || '')
      );
    }
  }

  // Shows the selected screen and hides the other screens
  showSelectedPage(page: string) {
    this.game = false;
    this.combi = false;
    this.main = false;
    this.endGame = false;

    switch (page) {
      case 'main':
        this.main = true;
        break;
      case 'game':
        this.game = true;
        break;
      case 'combi':
        this.combi = true;
        break;
      default:
        this.main = true;
    }
  }

  homeBtnClick() {
    this.clearTimers();
    this.showSelectedPage('main');
  }

  playBtnClick() {
    // Initialising the first 2 numbers for calculations
    this.firstNum = this.getRandomNumbers(0, 12);
    this.secondNum = this.getRandomNumbers(0, 12);

    // Reset the score before starting a new game.
    this.currentScore = 0;

    // Retrieving the arithmetic operator to be displayed
    this.operators.forEach((operator) => {
      if (operator.value === this.opSelected) {
        this.opDisplay = operator.displayValue;
      }
    });

    this.showSelectedPage('game');
    this.startReadyTimer();
  }

  viewCombiBtnClick() {
    this.clearTimers();

    // Initialising the combinations found
    this.firstArray = [];
    this.secondArray = [];
    this.combiFound = 0;

    // Sorting the first number in ascending order.
    this.combinationMap = new Map(
      [...this.combinationMap].sort((a, b) => a[0] - b[0])
    );

    for (let [key, value] of this.combinationMap) {
      this.firstArray.push(key);

      // Sorting the second number in ascending order
      value = value?.sort((a, b) => a - b);
      this.secondArray.push(value);

      // Counting the number of combinations found
      this.combiFound += value?.length || 0;
    }

    this.showSelectedPage('combi');
  }

  // Method to run to generate a random number within the minimum and maximum number provided.
  getRandomNumbers(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  submitClick() {
    // Rounding up the answer provided by player to 2 decimal places, to ensure accuracy of answer.
    let playerAnswer = parseFloat(this.ansInput.nativeElement.value).toFixed(2);
    let actualAnswer;

    // Calculating the actual answer.
    switch (this.opSelected) {
      case 'plus':
        actualAnswer = (this.firstNum + this.secondNum).toFixed(2);
        break;
      case 'minus':
        actualAnswer = (this.firstNum - this.secondNum).toFixed(2);
        break;
      case 'multiply':
        actualAnswer = (this.firstNum * this.secondNum).toFixed(2);
        break;
      case 'divide':
        actualAnswer = (this.firstNum / this.secondNum).toFixed(2);
        break;
      default:
        actualAnswer = this.firstNum * this.secondNum;
    }

    if (playerAnswer === actualAnswer) {
      // Changes inputbox to green to indicate a correct answer.
      this.renderer.setStyle(
        this.ansInput.nativeElement,
        'background-color',
        'green'
      );
      // Check if the first number has already been recorded down.
      if (this.combinationMap.get(this.firstNum)) {
        // Retrieve the array of second number that are recorded together with the first number.
        var second: Array<number> | undefined = this.combinationMap.get(
          this.firstNum
        );

        // Check if the second number has already been recorded down.
        if (!second?.includes(this.secondNum)) {
          // Storing the first and second number pair into a hashmap.
          second?.push(this.secondNum);
          this.combinationMap.set(this.firstNum, second);
        }
      } else {
        // Storing the first and second number pair into a hashmap.
        this.combinationMap.set(this.firstNum, [this.secondNum]);
      }
      // Re-generating the first and second numbers upon correct answer.
      this.firstNum = this.getRandomNumbers(0, 12);
      this.secondNum = this.getRandomNumbers(0, 12);

      // Adding to the current score upon correct answer.
      ++this.currentScore;
    } else {
      // Changes inputbox to red to indicate a wrong answer.
      this.renderer.setStyle(
        this.ansInput.nativeElement,
        'background-color',
        'red'
      );
      // Subtracting from the current score upon wrong answer.
      --this.currentScore;
    }
    // Clearing the player input and keep the focus on the input for fast answering.
    this.ansInput.nativeElement.value = null;
    this.ansInput.nativeElement.focus();
  }

  // Setting the arithmetic operator based on player's selection.
  onSelected(value: string) {
    this.opSelected = value;
  }

  // Setting a countdown timer for player to get ready before starting.
  startReadyTimer() {
    this.clearTimers();
    // this.endGame = false;
    this.countdown = true;
    this.countdownInterval = setInterval(() => {
      if (this.countdownTime > 0) {
        this.countdownTime--;

        // Enabling the player's input and re-initialising inputbox to white when timer reaches 0 seconds.
        if (this.countdownTime === 0) {
          this.inputDisabled = false;
          this.renderer.setStyle(
            this.ansInput.nativeElement,
            'background-color',
            'white'
          );
        }
      } else {
        // Disable countdown timer and start the game timer.
        this.countdown = false;
        this.clearTimers();
        this.startGameTimer();
      }
    }, 1000);
  }

  // Setting the timer for player to play the game.
  startGameTimer() {
    // Setting the focus on input for convenience of player.
    this.ansInput.nativeElement.focus();
    this.gameTimerInterval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        // Displaying end game screen and disable all inputs and timers.
        this.endGame = true;
        this.ansInput.nativeElement.value = null;
        this.inputDisabled = true;
        this.clearTimers();

        // Setting a new high score and storing it in the local storage.
        if (this.highScore < this.currentScore) {
          this.highScore = this.currentScore;
          this.localStorage.save('highscore', this.highScore.toString());
        }

        // Sorting the first number in ascending order.
        this.combinationMap = new Map(
          [...this.combinationMap].sort((a, b) => a[0] - b[0])
        );

        // Storing the combinations found in the local storage.
        this.localStorage.save(
          'combinations',
          JSON.stringify(Array.from(this.combinationMap.entries()))
        );
      }
    }, 1000);
  }

  // Clearing all the timers set and re-initialising time
  clearTimers() {
    this.timeLeft = 60;
    this.countdownTime = 3;
    clearInterval(this.countdownInterval);
    clearInterval(this.gameTimerInterval);
  }
}
