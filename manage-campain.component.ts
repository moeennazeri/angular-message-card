import {Component,OnInit,Output,ViewChild,AfterViewInit,EventEmitter,Input,OnChanges, SimpleChanges} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { NgSelectModule } from "@ng-select/ng-select";
import { ConfirmLogoutComponent } from "../confirm-logout/confirm-logout.component";
import { mobileApiService,Card,Item,Selections,RelatedMessage,loadmember} from "../services/mobile-api.service";
import { Observable } from "rxjs";
import { Renderer2, ElementRef } from "@angular/core";
import { JalaliPopupDatePickerComponent } from "../jalali-popup-date-picker/jalali-popup-date-picker.component";
import { PublicService } from "../services/public.service";



declare var mds: any;

@Component({
  selector: "app-manage-campain",
  standalone: true,
  imports: [FormsModule,CommonModule,NgSelectModule,ConfirmLogoutComponent,JalaliPopupDatePickerComponent],
  templateUrl: "./manage-campain.component.html",
  styleUrls: ["./manage-campain.component.scss"],
})
export class ManageCampainComponent implements OnInit, OnChanges {
 
  @Input() campaignItems: Item[] = [];
  @Input() platformItems: Item[] = [];
  @Input() currentUrl: string = ""; // این url از پدر میاد
  @Input() cards: Card[] = []; // دریافت کارت‌ها از کامپوننت پدر
  @Output() cardsUpdated = new EventEmitter<Card[]>(); // EventEmitter برای ارسال کارد‌ها
  @Input() showAdvancedSearch: boolean = true;
  @ViewChild("messagesContainer") messagesContainer!: ElementRef;
  showPopup:
    | { type: "message" | "card" | "cardMessage"; id: number; card?: Card }
    | false = false;

  currentCard: any;
  currentIndex: number = 0;
  selectedCampaign: Item | null = null;
  selectedPlatform: Item | null = null;
  items: Item[] = [];
  items2: Item[] = [];
  replyMessageId: number | null = null; // ذخیره آی‌دی پیامی که قرار است پاسخ داده شود
  replyText: string = ""; // ذخیره متن پاسخ
  replyingToText: string = ""; // ذخیره متن پیامی که قرار است به آن پاسخ داده شود
  isLoading: boolean = false;
  selectedDate1: string = '';
  selectedDate2: string = '';


  constructor(
    private mobileApiService: mobileApiService,
    private renderer: Renderer2,
    private el: ElementRef,
    public loading:PublicService
  ) {}
 ngOnChanges(changes: SimpleChanges): void {
    console.log("ManageCampainComponent: ngOnChanges triggered.", changes);

    // اگر 'cards' از والد تغییر کرد و مقداری داشت
    if (changes["cards"]) { // بررسی وجود تغییر
      if (changes["cards"].currentValue && changes["cards"].currentValue.length > 0) {
        this.cards = changes["cards"].currentValue;
        this.processReplies();
        this.isLoading = false; // اگر isLoading بود، خاتمه یابد
        console.log("ngOnChanges: Cards received from parent:", this.cards);
      } else if (changes["cards"].currentValue) { // اگر آرایه خالی هم از والد آمد
        this.cards = [];
        this.isLoading = false;
        console.log("ngOnChanges: Empty cards array received from parent.");
      }
    }

    // اگر 'campaignItems' از والد تغییر کرد
    if (changes["campaignItems"] && changes["campaignItems"].currentValue) {
      this.items = [...changes["campaignItems"].currentValue];
      console.log("ngOnChanges: Campaign Items received from parent:", this.items);
    } else if (changes["campaignItems"]) { // اگر تغییر وجود داشت اما مقدار null/undefined بود
      this.items = []; // آرایه را خالی کن
      console.log("ngOnChanges: No valid campaignItems received from parent (or it's null/undefined).");
    }

    // اگر 'platformItems' از والد تغییر کرد
    if (changes["platformItems"] && changes["platformItems"].currentValue) {
      this.items2 = [...changes["platformItems"].currentValue];
      console.log("ngOnChanges: Platform Items received from parent:", this.items2);
    } else if (changes["platformItems"]) { // اگر تغییر وجود داشت اما مقدار null/undefined بود
      this.items2 = []; // آرایه را خالی کن
      console.log("ngOnChanges: No valid platformItems received from parent (or it's null/undefined).");
    }

  }
   ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    // فعال‌سازی دیت‌پیکرها فقط اگر showAdvancedSearch true است
    if (this.showAdvancedSearch) {
      setTimeout(() => {
        const dtp1Element = document.getElementById("dtp1");
        if (dtp1Element) {
          new mds.MdsPersianDateTimePicker(dtp1Element, {
            targetTextSelector: '[data-name="dtp1-text"]',
            targetDateSelector: '[data-name="dtp1-date"]',
          });
        }
        const dtp2Element = document.getElementById("dtp2");
        if (dtp2Element) {
          new mds.MdsPersianDateTimePicker(dtp2Element, {
            targetTextSelector: '[data-name="dtp2-text"]',
            targetDateSelector: '[data-name="dtp2-date"]',
          });
        }
      }, 0);
    }
  }
  selectCampaign(item: Item) {
    const maxWords = 8; // تعداد کلماتی که می‌خواهید نمایش دهید
    const words = item.value.split(' ');
    const displayedText = words.length > maxWords ? words.slice(0, maxWords).join(' ') + '...' : item.value;

    this.selectedCampaign = { ...item, value: displayedText }; // ایجاد یک شیء جدید با متن کوتاه شده
    console.log('کمپین انتخاب شده:', this.selectedCampaign);
    // اگر بعد از انتخاب کمپین نیاز به ارسال به سرور دارید، اینجا می‌توانید آن را انجام دهید.
  }

  selectPlatform(item: Item) {
    this.selectedPlatform = item;
    console.log('پلتفرم انتخاب شده:', this.selectedPlatform);
    // اگر بعد از انتخاب پلتفرم نیاز به ارسال به سرور دارید، اینجا می‌توانید آن را انجام دهید.
  }
  handleDate(event: { id: string; value: string }) {
    console.log(`📆 تاریخ انتخاب‌شده برای ${event.id}: ${event.value}`);
    if (event.id === 'date1') {
      this.selectedDate1 = event.value;
    } else if (event.id === 'date2') {
      this.selectedDate2 = event.value;
    }
  }
logSelections() {
  console.log("logSelections called");
  this.loading.ShowLoading();

  const date1 = this.selectedDate1.replace(/\//g, "");
  const date2 = this.selectedDate2.replace(/\//g, "");

  console.log("✅ Date 1 (formatted):", date1);
  console.log("✅ Date 2 (formatted):", date2);

  const requestData: Selections = {
    fromDate: Number.parseInt(date1),
    toDate: Number.parseInt(date2),
    ukMessageIds: this.selectedCampaign ? [this.selectedCampaign.valueId] : [],
    platform: [],
  };

  console.log("🚀 ارسال requestData:", requestData);

  this.mobileApiService.fetchMessages(requestData).subscribe({
    next: (data: any) => {
      this.cards = data.messages;
      this.items = data.umDropDownContents;
      this.items2 = data.smDropDownContents;
      this.processReplies();

      console.log("📌 Filtered Cards:", this.cards);
      console.log("📌 Updated Dropdown Items:", this.items);
      console.log("📌 Updated Dropdown Items2:", this.items2);
    },
    error: (error) => {
      console.error("❌ خطا در دریافت اطلاعات:", error);

      this.loading.showMsg({
        title: "خطا",
        message: "خطا در دریافت اطلاعات از سرور. لطفاً دوباره تلاش کنید.",
        type: "error",
        duration: 3000
      });

      scrollTo({ top: 0, behavior: 'smooth' });
    },
    complete: () => {
      this.loading.HideLoading();
      console.log("✅ دریافت داده‌ها تکمیل شد");
    }
  });
}


  

  fetchMessages(requestData: Selections): Observable<Card[]> {
    return this.mobileApiService.fetchMessages(requestData);
  }

  // @Input() Cards: Card[] = [];
  // @Input() selectedCard!: Card | null; // دریافت پیام از پدر
  selectedCardId: number | null = null;

  // ngOnChanges() {
  //   if (this.selectedCard) {
  //     this.selectedCardId = this.selectedCard.id;
  //   }
  // }

  toggleRelatedMessages(card: any, event: Event) {
    let previousCardElement: HTMLElement | null = null;

    // بستن کارت قبلی (اگر باز بود)
    if (this.selectedCardId !== null) {
      const previousCard = this.cards.find((c) => c.id === this.selectedCardId);
      if (previousCard) {
        previousCard.expanded = false;
      }

      // پیدا کردن کارت قبلی در DOM
      previousCardElement = document.querySelector(
        `.custom-card[data-id="${this.selectedCardId}"]`
      );
    }

    // باز و بسته کردن کارت جدید
    if (this.selectedCardId === card.id) {
      this.selectedCardId = null;
      card.expanded = false;
    } else {
      this.selectedCardId = card.id;
      card.expanded = true;
    }

    const cardElement = (event.currentTarget as HTMLElement).closest(
      ".custom-card"
    );

    if (card.expanded) {
      this.renderer.addClass(cardElement, "expanded-card");
    } else {
      this.renderer.removeClass(cardElement, "expanded-card");
    }

    // ✅ این خط باعث می‌شه کارت قبلی به حالت عادی برگرده و پیام‌ها زیرش قرار نگیرن
    if (previousCardElement) {
      this.renderer.removeClass(previousCardElement, "expanded-card");
    }
  }

  formatPersianDate(date: string | number): string {
    const dateStr = date.toString(); // تبدیل به رشته برای اطمینان
    if (dateStr.length !== 8 || isNaN(Number(dateStr))) return "تاریخ نامعتبر"; // بررسی صحت مقدار

    const year = dateStr.substring(0, 4); // چهار رقم اول: سال
    const month = dateStr.substring(4, 6); // دو رقم بعدی: ماه
    const day = dateStr.substring(6, 8); // دو رقم آخر: روز

    return `${year}/${month}/${day}`; // فرمت نهایی
  }

  openReplyBox(messageId: number, messageText: string) {
    this.replyMessageId = messageId;
    this.replyText = ""; // مقدار ورودی را خالی کن
    this.replyingToText = messageText; // مقدار پیام اصلی را تنظیم کن
  }

  closeReplyBox() {
    this.replyMessageId = null;
    this.replyingToText = ""; // مقدار متن پیام را نیز پاک کن
  }

  sendReply() {
  if (this.replyMessageId !== null && this.replyText.trim() !== "") {
    let targetCard = null;
    let originalMsg = null;

    for (let card of this.cards) {
      const foundMsg = card.relatedMessages.find(
        (msg) => msg.id === this.replyMessageId
      );
      if (foundMsg) {
        targetCard = card;
        originalMsg = {
          id: foundMsg.id,
          message: foundMsg.message,
          userName: foundMsg.userName,
        };
        break;
      }

      if (card.id === this.replyMessageId) {
        targetCard = card;
        originalMsg = {
          id: card.id,
          message: card.message,
          userName: "",
        };
        break;
      }
    }

    if (!targetCard || !originalMsg) return;

    const phoneNumber = targetCard.phone;
    const unmId = targetCard.unmId;
    const chatId = targetCard.chatId;

    this.mobileApiService
      .replyToMessage(this.replyText, phoneNumber, originalMsg.id, unmId,chatId)
      .subscribe({
        next: (response) => {
          if (response.message) {
            const newReply: RelatedMessage = {
              id: response.message.id,
              message: this.replyText,
              date: new Date().toISOString().split("T")[0],
              time: new Date().toLocaleTimeString(),
              userName: "",
              repliedToMessage: originalMsg,
            };

            targetCard.relatedMessages.unshift(newReply);
            this.closeReplyBox();

            this.loading.showMsg({
              title: "موفقیت",
              message: "پاسخ با موفقیت ارسال شد.",
              type: "success",
              duration: 2000
            });

            scrollTo({ top: 0, behavior: "smooth" });
          }
        },
        error: (error) => {
          console.error("خطا در ارسال پاسخ:", error);

          this.loading.showMsg({
            title: "خطا",
            message: "خطا در ارسال پاسخ. لطفاً دوباره تلاش کنید.",
            type: "error",
            duration: 3000
          });

          scrollTo({ top: 0, behavior: "smooth" });
        }
      });
  }
}

  // حذف پیام
 deleteMessage(messageId: number) {
  console.log("🟡 حذف پیام با آی‌دی:", messageId);

  this.mobileApiService.deleteMessage(messageId).subscribe({
    next: (response) => {
      if (response.message) {
        console.log("🟢 پاسخ موفق:", response.message);

        const cardWithMessage = this.cards.find((card) =>
          card.relatedMessages.some((msg) => msg.id === messageId)
        );

        if (cardWithMessage) {
          cardWithMessage.relatedMessages =
            cardWithMessage.relatedMessages.filter(
              (msg) => msg.id !== messageId
            );
          this.cards = [...this.cards];
          console.log("✅ پیام از UI حذف شد");

          this.loading.showMsg({
            title: "موفقیت",
            message: "پیام با موفقیت حذف شد.",
            type: "success",
            duration: 2000
          });

          scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    },
    error: (error) => {
      console.error("🔴 خطا در حذف پیام:", error);

      this.loading.showMsg({
        title: "خطا",
        message: "خطا در حذف پیام. لطفاً دوباره تلاش کنید.",
        type: "error",
        duration: 3000
      });

      scrollTo({ top: 0, behavior: "smooth" });
    }
  });
}

  // نمایش دیالوگ قبل از حذف
  confirmDelete(
    type: "card" | "message" | "cardMessage",
    id: number,
    card?: Card
  ) {
    this.showPopup = { type, id, card };
  }
deleteCardMessage(card: Card) {
  const messageIdToDelete = card.mainMessageId ?? card.id;

  this.loading.ShowLoading();

  this.mobileApiService.deleteMessage(messageIdToDelete).subscribe({
    next: (response) => {
      this.loading.HideLoading();

      if (response.message) {
        this.loading.showMsg({
          title: 'موفق',
          message: 'پیام کارت با موفقیت حذف شد.',
          type: 'success',
          duration: 2500,
        });

        // حذف پیام از relatedMessages (در صورت وجود)
        card.relatedMessages = card.relatedMessages.filter(
          msg => msg.id !== messageIdToDelete
        );

        // جایگزین کردن پیام اصلی با پیام بعدی (در صورت وجود)
        const newMainMessage = card.relatedMessages.shift();
        if (newMainMessage) {
          card.message = newMainMessage.message;
          card.mainMessageId = newMainMessage.id;
        } else {
          card.message = '';
          card.mainMessageId = undefined;
        }

        this.cards = [...this.cards]; // ری‌فرش UI
      }
    },
    error: (error) => {
      this.loading.HideLoading();
      console.error("🔴 خطا در حذف پیام کارت:", error);
      this.loading.showMsg({
        title: 'خطا',
        message: 'خطا در حذف پیام. لطفاً دوباره تلاش کنید.',
        type: 'error',
        duration: 2500,
      });
    }
  });
}

  
  
  

  handleDeleteConfirmation(action: string) {
    if (action === "confirm" && this.showPopup) {
      if (this.showPopup.type === "message" && this.showPopup.card) {
        this.deleteMessage(this.showPopup.id);
      }
  
      if (this.showPopup.type === "cardMessage" && this.showPopup.card) {
        this.deleteCardMessage(this.showPopup.card);
      }
    }
  
    this.showPopup = false;
  }
  

  processReplies() {
    this.cards.forEach((card) => {
      card.relatedMessages.forEach((msg) => {
        if (msg.messageId !== null && msg.messageId !== undefined) {
          const repliedTo = card.relatedMessages.find(
            (m) => m.id === msg.messageId
          );
          if (repliedTo) {
            msg.repliedToMessage = {
              id: repliedTo.id,
              message: repliedTo.message,
              userName: repliedTo.userName,
            };
          }
        }
      });
    });
  }
}
