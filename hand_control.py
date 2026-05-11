import cv2
import mediapipe as mp
import pyautogui
import math
import numpy as np

# webcam
cap = cv2.VideoCapture(0)

# screen size
screen_w, screen_h = pyautogui.size()

# mediapipe
mp_hands = mp.solutions.hands

hands = mp_hands.Hands(
    max_num_hands=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)

mp_draw = mp.solutions.drawing_utils

clicking = False

while True:

    success, frame = cap.read()

    if not success:
        break

    # mirror effect
    frame = cv2.flip(frame, 1)

    h, w, _ = frame.shape

    # RGB convert
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # process hand
    result = hands.process(rgb)

    if result.multi_hand_landmarks:

        for hand_landmarks in result.multi_hand_landmarks:

            # skeleton
            mp_draw.draw_landmarks(
                frame,
                hand_landmarks,
                mp_hands.HAND_CONNECTIONS,
                mp_draw.DrawingSpec(color=(0,255,255), thickness=2),
                mp_draw.DrawingSpec(color=(255,0,255), thickness=2)
            )

            # index finger tip
            index_tip = hand_landmarks.landmark[8]

            x = int(index_tip.x * w)
            y = int(index_tip.y * h)

            # convert to screen coordinates
            screen_x = np.interp(x, [0, w], [0, screen_w])
            screen_y = np.interp(y, [0, h], [0, screen_h])

            # move mouse
            pyautogui.moveTo(screen_x, screen_y)

            # neon cursor
            cv2.circle(frame, (x, y), 15, (255,255,0), -1)

            # thumb
            thumb_tip = hand_landmarks.landmark[4]

            tx = int(thumb_tip.x * w)
            ty = int(thumb_tip.y * h)

            # distance thumb + index
            dist = math.hypot(tx - x, ty - y)

            # CLICK
            if dist < 40:

                if not clicking:
                    pyautogui.click()
                    clicking = True

                cv2.putText(
                    frame,
                    "CLICK",
                    (50,100),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0,255,0),
                    3
                )

            else:
                clicking = False

            # ⚡ electric particles
            for i in range(8):

                px = x + np.random.randint(-20,20)
                py = y + np.random.randint(-20,20)

                cv2.circle(
                    frame,
                    (px,py),
                    2,
                    (255,255,0),
                    -1
                )

    # show
    cv2.imshow("AR Hand Computer Control", frame)

    # ESC to exit
    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()