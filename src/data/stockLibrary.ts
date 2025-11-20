export interface StockItem {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  text: string;
}

export const stockLibrary: StockItem[] = [
  {
    id: 'fable1',
    title: "The Fox and the Grapes",
    description: "A classic fable by Aesop.",
    audioUrl: "https://ia800207.us.archive.org/29/items/aesop_fables_volume_one_librivox/fables_01_01_aesop.mp3",
    text: `A Fox one day spied a beautiful bunch of ripe grapes hanging from a vine trained along the branches of a tree. The grapes seemed ready to burst with juice, and the Fox's mouth watered as he gazed longingly at them.
    
"The very thing I need to quench my thirst," said he. Drawing back a few paces, he took a run and a jump, and just missed the bunch. Turning round again with a One, Two, Three, he jumped up, but with no greater success.
    
Again and again he tried after the tempting morsel, but at last had to give it up, and walked away with his nose in the air, saying: "I am sure they are sour."`
  },
  {
    id: 'wiki_dichotic',
    title: "Dichotic Listening (Wiki)",
    description: "Explanation of the dichotic listening test.",
    // Using a placeholder reliable audio or another LibriVox file as a proxy for "Informational"
    audioUrl: "https://ia800207.us.archive.org/29/items/antiquity_of_man_1211_librivox/antiquityofman_01_lyell.mp3",
    text: `Dichotic listening tests are a psychological test commonly used to investigate selective attention within the auditory system. The test involves presenting two different auditory stimuli simultaneously to the participant, one to each ear.`
  },
  {
    id: 'fable2',
    title: "The Frogs Desiring a King",
    description: "Another Aesop Fable.",
    audioUrl: "https://ia800207.us.archive.org/29/items/aesop_fables_volume_one_librivox/fables_01_03_aesop.mp3",
    text: `The Frogs were living as happy as could be in a marshy swamp that just suited them; they went splashing about caring for nobody and nobody troubling with them.
    
But some of them thought that this was not right, that they should have a King and a proper Constitution, so they determined to send up a petition to Jove to give them what they wanted.
    
"Mighty Jove," they cried, "send unto us a King that will rule over us and keep us in order."
    
Jove laughed at their croaking, and threw down into the swamp a huge Log. The Frogs were frightened out of their lives by the commotion made in their midst, and all rushed to the bank to look at the horrible monster; but after a time, seeing that it did not move, one or two of the boldest of them ventured out towards the Log, and even dared to touch it; still it did not move. Then the greatest hero of the Frogs jumped upon the Log and commenced dancing up and down upon it, thereupon all the Frogs came and did the same; and for some time they became famous for their grave and wise King.`
  }
];

