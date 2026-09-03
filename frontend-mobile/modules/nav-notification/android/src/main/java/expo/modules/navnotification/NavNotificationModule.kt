package expo.modules.navnotification

import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.annotation.ChecksSdkIntAtLeast
import androidx.core.app.NotificationChannelCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.graphics.drawable.IconCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record


class NavGuidanceRecord : Record {
  @Field var turnType: String? = null
  @Field var instruction: String? = null
  @Field var distanceLabel: String? = null
  @Field var nextInstruction: String? = null
  @Field var progress: Double = 0.0
  @Field var status: String? = null
  @Field var hasArrived: Boolean = false

  // Libellés que la notification compose elle-même, fournis traduits par le JS
  // (services/navigationNotification.js). Les valeurs par défaut sont les textes
  // français d'origine : un binaire à jour reste compatible avec un bundle qui ne
  // les enverrait pas encore.
  //
  // i18n-exempt-start: replis de compatibilité — un bundle à jour envoie toujours
  // ces libellés traduits, ces valeurs ne s'affichent que face à un JS antérieur.
  @Field var arrivedTitle: String = "Vous êtes arrivé !"
  @Field var rerouteTitle: String = "Recalcul de l'itinéraire…"
  @Field var fallbackTitle: String = "Navigation"
  @Field var nextPrefix: String = "Ensuite :"
  // i18n-exempt-end
}

/** Libellés fixés à l'ouverture du canal, avant toute mise à jour de guidage. */
class NavLabelsRecord : Record {
  // i18n-exempt-start: replis de compatibilité, cf. NavGuidanceRecord
  @Field var channelName: String = "Navigation"
  @Field var startingInstruction: String = "Navigation en cours"
  @Field var startingDistanceLabel: String = "Calcul du guidage…"
  // i18n-exempt-end
}

class NavNotificationModule : Module() {
  companion object {
    private const val CHANNEL_ID = "navigation-guidance"
    private const val NOTIFICATION_ID = 42_100
    private const val ACCENT_COLOR = 0xFF646CFF.toInt()
    private const val PROGRESS_MAX = 1000

    /** Android 16 (Baklava) : première version à promouvoir les notifications. */
    private const val LIVE_UPDATE_SDK = 36
  }

  private val context: Context
    get() = requireNotNull(appContext.reactContext) { "Contexte React indisponible" }

  // Le nom du canal est posé par start() puis réutilisé par chaque post() :
  // ensureChannel() est appelé aux deux endroits, et recréer le canal avec un
  // nom français écraserait celui que l'utilisateur voit dans les réglages
  // Android. Repli sur le français, comme les champs du record.
  // i18n-exempt: repli de compatibilité, écrasé par start() dès le premier appel
  private var channelName: String = "Navigation"

  override fun definition() = ModuleDefinition {
    Name("NavNotification")

    AsyncFunction("start") { labels: NavLabelsRecord ->
      channelName = labels.channelName
      ensureChannel()
      val initial = NavGuidanceRecord().apply {
        instruction = labels.startingInstruction
        distanceLabel = labels.startingDistanceLabel
      }
      post(initial)
    }

    AsyncFunction("update") { guidance: NavGuidanceRecord ->
      post(guidance)
    }

    AsyncFunction("stop") {
      NotificationManagerCompat.from(context).cancel(NOTIFICATION_ID)
    }

    // Diagnostic : la promotion échoue en silence côté système, et l'utilisateur
    // peut la refuser application par application. Sans ce retour, une chip
    // absente est indiscernable d'une chip cassée.
    AsyncFunction("getChipStatus") {
      mapOf(
        "supported" to supportsLiveUpdate(),
        "allowed" to canPostPromoted(),
      )
    }
  }

  @ChecksSdkIntAtLeast(api = LIVE_UPDATE_SDK)
  private fun supportsLiveUpdate(): Boolean = Build.VERSION.SDK_INT >= LIVE_UPDATE_SDK

  private fun canPostPromoted(): Boolean {
    if (Build.VERSION.SDK_INT < LIVE_UPDATE_SDK) return false
    val manager = context.getSystemService(NotificationManager::class.java) ?: return false
    return manager.canPostPromotedNotifications()
  }

  private fun ensureChannel() {
    val channel = NotificationChannelCompat.Builder(
      CHANNEL_ID,
      // IMPORTANCE_LOW convient à la promotion ; seul IMPORTANCE_MIN la refuse.
      NotificationManagerCompat.IMPORTANCE_LOW,
    )
      .setName(channelName)
      .setSound(null, null)
      .setVibrationEnabled(false)
      .setShowBadge(false)
      .build()
    NotificationManagerCompat.from(context).createNotificationChannel(channel)
  }

  private fun post(g: NavGuidanceRecord) {
    ensureChannel()

    val title: String
    val text: String
    when {
      g.hasArrived -> {
        title = g.arrivedTitle
        text = ""
      }
      g.status == "off_route" -> {
        title = g.rerouteTitle
        text = ""
      }
      else -> {
        title = g.instruction?.takeIf { it.isNotBlank() } ?: g.fallbackTitle
        text = listOfNotNull(
          g.distanceLabel?.takeIf { it.isNotBlank() },
          g.nextInstruction?.takeIf { it.isNotBlank() }?.let { "${g.nextPrefix} $it" },
        ).joinToString(" • ")
      }
    }

    val progress = (g.progress.coerceIn(0.0, 1.0) * PROGRESS_MAX).toInt()

    // Un titre non vide et setOngoing sont deux des conditions de promotion :
    // les retirer suffirait à faire disparaître la chip.
    val builder = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(iconFor(g))
      .setContentTitle(title)
      .setContentText(text)
      .setColor(ACCENT_COLOR)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setSound(null)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .setCategory(NotificationCompat.CATEGORY_NAVIGATION)

    if (supportsLiveUpdate()) {
      applyLiveUpdate(builder, g, progress)
    } else {
      applyClassic(builder, text, progress)
    }

    try {
      NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, builder.build())
    } catch (_: SecurityException) {

    }
  }

  /**
   * Android 16 : demande la promotion en Live Update. La notification remonte
   * alors en chip dans la barre de statut et en carte sur l'écran verrouillé.
   *
   * setColorized() est volontairement absent : une notification colorisée est
   * disqualifiée de la promotion, et l'appeler ici suffirait à tout annuler.
   */
  private fun applyLiveUpdate(
    builder: NotificationCompat.Builder,
    g: NavGuidanceRecord,
    progress: Int,
  ) {
    builder.setRequestPromotedOngoing(true)

    // Le texte de la chip, réduit à quelques caractères par le système : la
    // distance restante d'abord, l'instruction seulement à défaut. Le paramètre
    // est nullable, une absence des deux laisse simplement la chip sans légende.
    builder.setShortCriticalText(
      g.distanceLabel?.takeIf { it.isNotBlank() }
        ?: g.instruction?.takeIf { it.isNotBlank() },
    )

    val style = NotificationCompat.ProgressStyle()
      // Un segment unique couvrant tout le trajet : le découpage par manœuvre
      // demanderait les longueurs de chaque étape, que le JS n'envoie pas.
      .setProgressSegments(
        listOf(NotificationCompat.ProgressStyle.Segment(PROGRESS_MAX).setColor(ACCENT_COLOR)),
      )
      // La flèche de manœuvre glisse le long de la barre au fil du trajet.
      .setProgressTrackerIcon(IconCompat.createWithResource(context, iconFor(g)))

    if (g.status == "off_route") {
      style.setProgressIndeterminate(true)
    } else {
      style.setProgress(progress)
    }

    builder.setStyle(style)
  }

  /** Android 15 et antérieur : notification enrichie, sans chip possible. */
  private fun applyClassic(builder: NotificationCompat.Builder, text: String, progress: Int) {
    builder
      .setColorized(true)
      .setProgress(PROGRESS_MAX, progress, false)

    if (text.isNotEmpty()) {
      builder.setStyle(NotificationCompat.BigTextStyle().bigText(text))
    }
  }

  private fun iconFor(g: NavGuidanceRecord): Int {
    if (g.hasArrived) return R.drawable.ic_nav_arrive
    if (g.status == "off_route") return R.drawable.ic_nav_reroute
    return when (g.turnType) {
      "depart" -> R.drawable.ic_nav_depart
      "continue" -> R.drawable.ic_nav_continue
      "slight_left" -> R.drawable.ic_nav_slight_left
      "slight_right" -> R.drawable.ic_nav_slight_right
      "turn_left" -> R.drawable.ic_nav_turn_left
      "turn_right" -> R.drawable.ic_nav_turn_right
      "sharp_left" -> R.drawable.ic_nav_sharp_left
      "sharp_right" -> R.drawable.ic_nav_sharp_right
      "u_turn" -> R.drawable.ic_nav_uturn
      "roundabout" -> R.drawable.ic_nav_roundabout
      "arrive" -> R.drawable.ic_nav_arrive
      else -> R.drawable.ic_nav_continue
    }
  }
}
