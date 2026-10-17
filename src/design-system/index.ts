/** Design system de merida-unificada: tokens (tokens.css), componentes base accesibles y utilidades de UI. */
export { Avatar, type AvatarProps } from "./components/Avatar";
export {
  BandaTematica,
  type AlineacionBanda,
  type BandaTematicaProps,
  type EnlaceBanda,
  type FotoBanda,
  type TonoBanda,
} from "./components/BandaTematica";
export { Badge, type BadgeProps } from "./components/Badge";
export { BrandLogo, type BrandLogoProps } from "./components/BrandLogo";
export { Button, type ButtonProps } from "./components/Button";
export { ButtonLink, type ButtonLinkProps } from "./components/ButtonLink";
export { Card, type CardProps } from "./components/Card";
export { ChainPattern, type ChainPatternProps } from "./components/ChainPattern";
export { ConfirmDialog, type ConfirmDialogProps } from "./components/ConfirmDialog";
export { DemoRibbon, TEXTO_ROTULO_DEMO, type DemoRibbonProps } from "./components/DemoRibbon";
export { DemoTag, type DemoTagProps } from "./components/DemoTag";
export { Dialog, type DialogProps } from "./components/Dialog";
export { EmptyState, type EmptyStateProps } from "./components/EmptyState";
export { ErrorState, type ErrorStateProps } from "./components/ErrorState";
export { GlifoPixel, type GlifoPixelProps } from "./components/GlifoPixel";
export { IconButton, IconButtonLink, type IconButtonLinkProps, type IconButtonProps } from "./components/IconButton";
export { LabGlyph, type LabGlyphProps } from "./components/LabGlyph";
export { LoadingState, type LoadingStateProps } from "./components/LoadingState";
export { MosaicoLaboratorio, type MosaicoLaboratorioProps } from "./components/MosaicoLaboratorio";
export { OfflineNotice, type OfflineNoticeProps } from "./components/OfflineNotice";
export { PageHeader, type PageHeaderProps } from "./components/PageHeader";
export { PatronCadena, type PatronCadenaProps } from "./components/PatronCadena";
export { SectionLabel, type SectionLabelProps } from "./components/SectionLabel";
export { Sheet, type SheetProps } from "./components/Sheet";
export { Skeleton, type SkeletonProps } from "./components/Skeleton";
export { SkipLink, type SkipLinkProps } from "./components/SkipLink";
export { Tile, type TileProps } from "./components/Tile";
export { Toaster } from "./components/Toaster";
export { Checkbox, type CheckboxProps } from "./components/Checkbox";
export { Chip, FilterChip, type ChipProps, type FilterChipProps } from "./components/Chip";
export { Field, type FieldProps } from "./components/Field";
export { InfoStatusBadge, type InfoStatusBadgeProps } from "./components/InfoStatusBadge";
export { IntegrationBadge, type IntegrationBadgeProps } from "./components/IntegrationBadge";
export { KeyValueList, type KeyValueListProps, type ParClaveValor } from "./components/KeyValueList";
export { RadioCardGroup, type OpcionRadioCard, type RadioCardGroupProps } from "./components/RadioCardGroup";
export { SegmentedControl, type OpcionSegmento, type SegmentedControlProps } from "./components/SegmentedControl";
export { Select, type OpcionSelect, type SelectProps } from "./components/Select";
export { SourceNote, type SourceNoteProps } from "./components/SourceNote";
export { StatusBadge, type StatusBadgeProps } from "./components/StatusBadge";
export { Stepper, type PasoStepper, type StepperProps } from "./components/Stepper";
export { Switch, type SwitchProps } from "./components/Switch";
export { Tabs, type Pestana, type TabsProps } from "./components/Tabs";
export { TextArea, type TextAreaProps } from "./components/TextArea";
export { CLASES_CONTROL, TextInput, type TextInputProps } from "./components/TextInput";
export { Timeline, type EventoTimeline, type TimelineProps } from "./components/Timeline";
export { VerificationBadge, type VerificationBadgeProps } from "./components/VerificationBadge";
export { VisuallyHidden, type VisuallyHiddenProps } from "./components/VisuallyHidden";

export { clasesBoton, clasesBotonIcono, type TamanoBoton, type VarianteBoton } from "./lib/button-styles";
export { unirIds, useCampo } from "./lib/campo";
export { cx } from "./lib/cx";
export { describirError, esErrorDefinitivo, type ErrorDescrito, type TipoError } from "./lib/errores";
export * from "./lib/estados";
export { formatearFecha, formatearFechaHora, type EstiloFecha } from "./lib/fechas";
export { ICONO_PREDETERMINADO, NOMBRES_ICONOS, resolverIcono } from "./lib/iconos";
export { FOTOS_BANDA, ICONOS_BANDA } from "./lib/recursos-laboratorio";
export { descartarAviso, notificar, useAvisos, type AvisoEmergente, type NuevoAviso, type TonoAviso } from "./lib/toast-store";
export { CLASES_INSIGNIA, CLASES_MOSAICO, type TonoInsignia, type TonoMosaico } from "./lib/tonos";
