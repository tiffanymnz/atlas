# Novice prerequisite hardening

This internal pass checks whether the displayed lesson supplies the knowledge it uses. It does not establish that an unfamiliar learner understood or retained the concept. The adult-observation gate remains open for Lessons 005–011.

## Findings and changes

| Lesson | Avoidable barrier | Change |
| --- | --- | --- |
| 005 | The first diagnostic invoked multiplication and subtraction before those operations were explained; the division hook introduced `÷` and `×` without defining their jobs. | The diagnostic now uses concrete sharing errors. The hook explains both signs by distributing and adding equal groups in English and Spanish. |
| 008 | The area lesson assumed the words *row* and *column* while claiming to build the rectangular count from scratch. | The introduction names both directions before the array model in both languages. |
| 009 | Transfer invoked area terminology even when entered directly from the lesson picker. | The prompt explains area as equal squares covering the inside before asking about edging. |
| 010–011 | A horizontal number line was declared prior knowledge despite no preceding Atlas lesson teaching it. | The introductions explain left and right order before the number-line model; prior-knowledge declarations no longer require that representation. |

Finishing a lesson is an activity record, not proof of understanding. The completion screen now shows the next-lesson shortcut only when the first submitted answers on independent practice, recall, and transfer were all correct without hints **and** the next lesson is in the same conceptual sequence. Otherwise it recommends review or directs the learner to the picker for a separate topic. This signal is intentionally narrow: three multiple-choice answers can be guessed, and the lesson picker remains available for exploration. It does not grant curriculum approval or claim mastery.

The numbered catalog contains four sequences: comparison (001–004), division to percent (005–007), area to perimeter (008–009), and inclusive inequality language (010–011). The transitions 004→005, 007→008, and 009→010 are changes of topic, not prerequisites. The picker now labels each option with its concept ID in the markup so the completion action follows the intended sequence instead of advancing merely because file numbers are adjacent.

The next evidence step is uncoached observation with learners unfamiliar with the material. Ask them to explain and apply each idea without the answer options or memory hook, especially the named whole in fractions and percent, square versus linear units, and inequality boundaries. Record actual misunderstandings before changing `adult_review_required`.
